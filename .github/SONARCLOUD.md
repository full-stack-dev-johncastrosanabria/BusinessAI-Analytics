# SonarCloud Integration

## Current Status

The repository has a **SonarCloud GitHub App** integration that is currently failing. This is separate from the SonarQube workflow in `.github/workflows/sonarqube.yml`.

## Issue

The SonarCloud check appears in GitHub Actions as "SonarCloud Code Analysis" and is failing with "Quality Gate failed". This is a GitHub App integration, not a workflow file.

## How to Disable SonarCloud

If you want to disable the SonarCloud integration:

### Option 1: Disable via GitHub Repository Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Integrations** → **GitHub Apps**
3. Find **SonarCloud** in the list
4. Click **Configure** or **Uninstall**
5. Remove the repository from SonarCloud's access or uninstall the app

### Option 2: Disable via SonarCloud Dashboard

1. Go to [SonarCloud](https://sonarcloud.io/)
2. Log in with your GitHub account
3. Navigate to your organization/project
4. Go to **Administration** → **Analysis Method**
5. Disable automatic analysis or remove the project

### Option 3: Configure SonarCloud Properly

If you want to keep SonarCloud but fix the quality gate:

1. Go to [SonarCloud](https://sonarcloud.io/)
2. Navigate to your project
3. Check the **Quality Gate** status and issues
4. Fix the reported issues in your code
5. Or adjust the Quality Gate rules in **Project Settings** → **Quality Gates**

## Alternative: Use SonarQube Instead

The repository already has a SonarQube workflow configured in `.github/workflows/sonarqube.yml`. To use it:

1. Set up a SonarQube server (self-hosted or cloud)
2. Add these secrets to your GitHub repository:
   - `SONAR_TOKEN`: Your SonarQube authentication token
   - `SONAR_HOST_URL`: Your SonarQube server URL
3. The workflow will automatically run on push/PR

## Recommendation

**Disable SonarCloud** if you're not actively using it, especially if you plan to use the SonarQube workflow instead. Having both can be confusing and cause duplicate checks.

To disable, follow **Option 1** above (GitHub Repository Settings).
