import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface AWSomeShopStackProps extends cdk.StackProps {
  environment: string;
  vpcId?: string; // 可选：使用现有 VPC 的 ID
}

export class AWSomeShopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AWSomeShopStackProps) {
    super(scope, id, props);

    const { environment, vpcId } = props;

    // ========================================
    // VPC 和网络配置
    // ========================================
    let vpc: ec2.IVpc;

    if (vpcId) {
      // 使用现有 VPC
      vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
        vpcId: vpcId,
      });

      cdk.Annotations.of(this).addInfo(`Using existing VPC: ${vpcId}`);
    } else {
      // 创建新 VPC
      vpc = new ec2.Vpc(this, 'AWSomeShopVPC', {
        vpcName: `awsome-shop-vpc-${environment}`,
        maxAzs: 2,
        natGateways: 1, // 生产环境建议2个以实现高可用
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      });

      // 为新创建的 VPC 启用 Flow Logs
      new ec2.FlowLog(this, 'VPCFlowLog', {
        resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
        trafficType: ec2.FlowLogTrafficType.ALL,
        destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      });
    }

    // ========================================
    // 安全组配置
    // ========================================
    // ALB 安全组
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      securityGroupName: `awsome-shop-alb-sg-${environment}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');

    // ECS 服务安全组
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      securityGroupName: `awsome-shop-ecs-sg-${environment}`,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.allTraffic(), 'Allow traffic from ALB');

    // ========================================
    // ECR 仓库 - 使用现有仓库
    // ========================================
    const backendRepo = ecr.Repository.fromRepositoryName(
      this,
      'BackendRepo',
      `awsome-shop-backend-${environment}`
    );

    const frontendRepo = ecr.Repository.fromRepositoryName(
      this,
      'FrontendRepo',
      `awsome-shop-frontend-${environment}`
    );

    // ========================================
    // ECS 集群
    // ========================================
    const cluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: `awsome-shop-cluster-${environment}`,
      vpc,
      enableFargateCapacityProviders: true,
    });

    // 启用 Container Insights
    cluster.addDefaultCloudMapNamespace({
      name: `awsome-shop-${environment}.local`,
      useForServiceConnect: true,
    });

    // ========================================
    // Application Load Balancer
    // ========================================
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `awsome-shop-alb-${environment}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // HTTP 监听器（生产环境应重定向到 HTTPS）
    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      open: true,
    });

    // ========================================
    // 后端 ECS 服务
    // ========================================
    const backendTaskRole = new iam.Role(this, 'BackendTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for backend ECS tasks',
    });

    const backendTaskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      family: `awsome-shop-backend-${environment}`,
      cpu: environment === 'prod' ? 1024 : 512,
      memoryLimitMiB: environment === 'prod' ? 2048 : 1024,
      taskRole: backendTaskRole,
    });

    const backendLogGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: `/ecs/awsome-shop-backend-${environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backendContainer = backendTaskDefinition.addContainer('backend', {
      containerName: 'backend',
      image: ecs.ContainerImage.fromEcrRepository(backendRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
        logGroup: backendLogGroup,
      }),
      environment: {
        DEBUG: environment !== 'prod' ? 'true' : 'false',
        AWS_REGION: this.region,
        DATABASE_URL: 'postgresql+asyncpg://awsome_shop:awsome_shop@awsome-shop.cluster-c92hqputny5p.us-west-2.rds.amazonaws.com:5432/awsome_shop',
      },
      portMappings: [
        {
          name: 'backend-8000',
          containerPort: 8000,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8000/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const backendService = new ecs.FargateService(this, 'BackendService', {
      serviceName: `awsome-shop-backend-${environment}`,
      cluster,
      taskDefinition: backendTaskDefinition,
      desiredCount: environment === 'prod' ? 2 : 1,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      circuitBreaker: {
        rollback: true,
      },
      // 启用 Service Connect
      serviceConnectConfiguration: {
        services: [
          {
            portMappingName: 'backend-8000',
            discoveryName: 'backend',
            port: 8000,
          },
        ],
      },
    });

    // 注意: 使用 Service Connect 架构,ALB 只路由到前端
    // 前端 Nginx 会将 /api/* 请求通过 Service Connect 代理到后端
    // 后端目标组和路由规则已移除,所有流量通过前端容器

    // ========================================
    // 前端 ECS 服务
    // ========================================
    const frontendTaskDefinition = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      family: `awsome-shop-frontend-${environment}`,
      cpu: environment === 'prod' ? 512 : 256,
      memoryLimitMiB: environment === 'prod' ? 1024 : 512,
    });

    const frontendLogGroup = new logs.LogGroup(this, 'FrontendLogGroup', {
      logGroupName: `/ecs/awsome-shop-frontend-${environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const frontendContainer = frontendTaskDefinition.addContainer('frontend', {
      containerName: 'frontend',
      image: ecs.ContainerImage.fromEcrRepository(frontendRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'frontend',
        logGroup: frontendLogGroup,
      }),
      // 注意: VITE_API_BASE_URL 是构建时环境变量,在 Dockerfile 构建时注入
      // 运行时环境变量对 Vite 构建的静态文件无效
      // Service Connect 配置使得前端可以通过 http://backend:8000 访问后端
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:80 || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      serviceName: `awsome-shop-frontend-${environment}`,
      cluster,
      taskDefinition: frontendTaskDefinition,
      desiredCount: environment === 'prod' ? 2 : 1,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      circuitBreaker: {
        rollback: true,
      },
      // 启用 Service Connect 客户端模式（只消费服务，不暴露服务）
      serviceConnectConfiguration: {
        services: [],  // 空数组表示只作为客户端
      },
    });

    // 将前端服务添加到 ALB（默认目标）
    httpListener.addTargets('FrontendTarget', {
      targetGroupName: `awsome-shop-frontend-${environment}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [frontendService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ========================================
    // Auto Scaling (生产环境)
    // ========================================
    if (environment === 'prod') {
      const backendScaling = backendService.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 10,
      });

      backendScaling.scaleOnCpuUtilization('BackendCPUScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(1),
      });

      backendScaling.scaleOnMemoryUtilization('BackendMemoryScaling', {
        targetUtilizationPercent: 80,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(1),
      });

      const frontendScaling = frontendService.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 10,
      });

      frontendScaling.scaleOnCpuUtilization('FrontendCPUScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(1),
      });
    }

    // ========================================
    // CloudFormation 输出
    // ========================================
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `AWSomeShop-ALB-DNS-${environment}`,
    });

    new cdk.CfnOutput(this, 'ApplicationURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Application URL',
      exportName: `AWSomeShop-URL-${environment}`,
    });

    new cdk.CfnOutput(this, 'BackendECRRepository', {
      value: backendRepo.repositoryUri,
      description: 'Backend ECR Repository URI',
      exportName: `AWSomeShop-Backend-ECR-${environment}`,
    });

    new cdk.CfnOutput(this, 'FrontendECRRepository', {
      value: frontendRepo.repositoryUri,
      description: 'Frontend ECR Repository URI',
      exportName: `AWSomeShop-Frontend-ECR-${environment}`,
    });
  }
}
