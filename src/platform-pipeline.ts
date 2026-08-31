import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as pipelines from '@aws-cdk/pipelines';
import { ShellScriptAction } from '@aws-cdk/pipelines';
import * as codepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import {
  Construct, SecretValue, Stack, StackProps,
} from '@aws-cdk/core';
import { DeployStage } from './deploy-stage';
import { MyEnv } from './interfaces/MyEnv';
import { myEnv } from '../config/env';

export interface PlatformPipelineProps extends StackProps {
  readonly githubToken: string;
  readonly gitHubOwner: string;
  readonly gitHubRepo: string;
  readonly myEnv: MyEnv;
}

export class PlatformPipeline extends Stack {
  constructor(scope: Construct, id: string, props: PlatformPipelineProps) {
    super(scope, id, props);

    // Defines the artifact representing the sourcecode
    const sourceArtifact = new codepipeline.Artifact();

    // Defines the artifact representing the cloud assembly
    // (cloudformation template + all other assets)
    const cdkOutputArtifact = new codepipeline.Artifact();

    // The basic pipeline declaration. This sets the initial structure
    // of our pipeline
    const pipeline = new pipelines.CdkPipeline(this, 'CustomerPlatform', {
      crossAccountKeys: false,
      pipelineName: 'PlatformPipeline',
      cloudAssemblyArtifact: cdkOutputArtifact,

      // Generates the source artifact from the GitHub
      sourceAction: new codepipelineActions.GitHubSourceAction({
        actionName: 'GitHub',
        branch: props.myEnv.branchName,
        owner: props.gitHubOwner,
        repo: props.gitHubRepo,
        oauthToken: SecretValue.secretsManager(props.githubToken),
        output: sourceArtifact,
      }),

      // Builds our source code outlined above into a could assembly artifact
      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact, // Where to get source code to build
        cloudAssemblyArtifact: cdkOutputArtifact, // Where to place built source

        buildCommand: 'npm run build', // Language-specific build cmd
      }),
    });

    const deploy = new DeployStage(this, 'Deploy', { env: myEnv });
    pipeline.addApplicationStage(deploy);
  }
}
