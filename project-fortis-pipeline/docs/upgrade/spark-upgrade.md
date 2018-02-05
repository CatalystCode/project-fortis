# Upgrading

Currently, components of the Fortis pipeline must be upgraded individually in order to migrate to a newer version. This document covers the upgrade process for each such component (WIP).

## Frontend + Services + Spark

```sh
ssh fortisadmin@YOUR_DEPLOY_VM_IP "sudo ~/upgrade-fortis-interfaces.sh RELEASE_TO_INSTALL"
ssh fortisadmin@YOUR_DEPLOY_VM_IP "sudo ~/upgrade-fortis-services.sh RELEASE_TO_INSTALL"
ssh fortisadmin@YOUR_DEPLOY_VM_IP "sudo ~/upgrade-fortis-spark.sh RELEASE_TO_INSTALL"
```
