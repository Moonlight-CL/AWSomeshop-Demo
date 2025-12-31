#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AWSomeShopStack } from '../lib/awsome-shop-stack';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '../../.env' });

const app = new cdk.App();

// 获取环境配置
const environment = app.node.tryGetContext('environment') || 'dev';
const vpcId = app.node.tryGetContext('vpcId'); // 可选：使用现有 VPC
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

// 创建 Stack
new AWSomeShopStack(app, `AWSomeShopStack-${environment}`, {
  env: {
    account,
    region,
  },
  environment,
  vpcId,
  stackName: `awsome-shop-${environment}`,
  description: `AWSomeShop Infrastructure Stack for ${environment} environment`,
  tags: {
    Application: 'AWSomeShop',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});

app.synth();
