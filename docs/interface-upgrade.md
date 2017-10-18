![image](https://user-images.githubusercontent.com/7635865/31180087-4bef49a6-a8e3-11e7-869c-6886608a731d.png)

# Fortis Interface Upgrade
The Fortis interface runs on Deis and Kubernetes. Deis is an open source heroku-inspired PaaS that helps manage and deploy applications on your own hardware. 

## Prerequisite
- A deployed Fortis pipeline
- Deployment public / private key locally installed
- Ensure the local ssh-agent is running `eval $(ssh-agent -s)`
- Ensure the deployment SSH private key is added to the agent `ssh-add ~/.ssh/K8`
- SSH'd into the Fortis jumpbox

## Deployment steps
- All below steps should take place on the Fortis jumpbox. 

### Environment setup

#### Elevate permissions

```bash
sudo su
```

#### Deploy latest interface codebase to Fortis cluster

```
cd /var/lib/waagent/custom-script/download/0/fortisdeploy/ops/
./deis-apps/fortis-interface/deploy-app.sh
```