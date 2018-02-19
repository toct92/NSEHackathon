# Sprint 11 Release (MDB_1_0_11)

### New Features
| Summary| Card Link |
| ------------| --------- |
|Hierarchical Clustering |https://trello.com/c/OovqscDh/344-implement-hierarchical-clustering-iteration-2 <br><br>https://trello.com/c/to8Heuhi/381-4implement-centroid-shift-for-hierarchical-clustering<br><br>https://trello.com/c/BX88iHqv/355-4core-clustering-logic-for-hierarchical-cluster<br><br>https://trello.com/c/rMAJ3rRQ/373-05-implement-a-scheduler-lambda-to-run-standalone-hierarchical-calculation-centroid-calculation-process-in-emr-05<br><br>https://trello.com/c/qPxYWdV0/374-05-implement-a-flag-in-lambda-and-batch-processing-to-run-kmeans-or-hierarchical-clustering-as-a-option-05<br><br>https://trello.com/c/VDsbJaPk/372-05-implement-hierarchical-clustering-column-assignment-while-feature-vector-processing-05|
|Bayesian Diagnostics using AWS API Gateway|https://trello.com/c/5yZ9FQG8/348-2-implement-bayesian-diagnostics-using-amazon-api-gateway-2<br><br>https://trello.com/c/iaPHx6Ce/349-2-update-cloudformation-with-amazon-api-gateway-for-bayesian-diagnostics|
|Added audit trail in data store for all click events|https://trello.com/c/Og05pF78/403-audit-trail-on-click-stream|


### Enhancements

| Summary| Card Link |
| ------------| --------- |
|Migrated batch processing data store from dynamoDB to Aurora |https://trello.com/c/qHz1Wr4k/350-3-migrate-clusters-data-store-from-dynamodb-to-aurora-35<br><br>https://trello.com/c/xvdYPwbh/345-3-migrate-column-cluster-map-data-store-from-dynamodb-to-aurora-35<br><br>https://trello.com/c/95MLvLQi/334-1-migrate-probability-matrix-storage-data-store-from-dynamodb-to-aurora-1<br><br>https://trello.com/c/dkAi5ohS/397-1-update-feedback-handlers-for-hierarchical-clustering-mode-1<br><br>https://trello.com/c/KZl9bwi8/333-1-migrate-log-odds-reference-matrix-data-store-from-dynamodb-to-aurora-1<br><br>https://trello.com/c/whYi8FHB/346-2-migrate-system-tables-data-store-from-dynamodb-to-aurora-2|
|Optimized Nearby Cluster Functionality|https://trello.com/c/akS8PhC8/393-3-implement-nearby-cluster-and-nearby-columns-2|
|Optimized Classification Job Scheduler|https://trello.com/c/y6uBAtp1/402-1-optimize-classification-job-scheduler-1|
|Async Writer for Classification data|https://trello.com/c/XC89vRr9/401-1-async-writer-for-classification-data-1|

### Bug Fixes
| Summary| Card Link |
| ------------| --------- |
|Rollbacks in MySQL transaction corrupts UI data|https://trello.com/c/8tBtLCAS/392-1-rollbacks-in-mysql-transaction-corrupts-ui-data-1|
|MySQL Lock Wait Timeout Limit Exceeded|https://trello.com/c/RBkilZsu/391-05-mysql-lock-wait-timeout-limit-exceeded-05|
|Fixed Bayesian Classifier Bugs|https://trello.com/c/5gLOYctb/389-05-fix-outside-count-calculation-05<br><br>https://trello.com/c/WYBe5E8u/390-05-outside-count-mismatch-05<br><br>https://trello.com/c/Ei3QPQAM/387-05-feature-columns-map-mismatch-05|

### Known Issues
* Spark blacklisted executor not respawned in EMR<br>https://trello.com/c/qiNr3tU6/394-spark-blacklisted-executor-not-respawned-in-emr

### Deployment
Using AWS Cloud formation in clean AWS environment
