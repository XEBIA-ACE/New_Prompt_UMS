      *****************************************************************
      * LGCFGPR - loads WS-CONFIG from environment variables:         *
      *   SVC001_DB2_SUBSYS, SVC001_VSAM_FILE, SVC001_TXN_LGACDB01,   *
      *   SVC001_LOG_QUEUE, SVC001_MQ_QUEUE                           *
      * Unset variables leave the field as SPACES; callers decide.    *
      *****************************************************************
       LOAD-CONFIG.
           MOVE 'SVC001_DB2_SUBSYS' TO WS-CFG-ENV-NAME
           PERFORM READ-ENV
           MOVE WS-CFG-ENV-VALUE TO WS-CFG-DB2-SUBSYS
           MOVE 'SVC001_VSAM_FILE' TO WS-CFG-ENV-NAME
           PERFORM READ-ENV
           MOVE WS-CFG-ENV-VALUE TO WS-CFG-VSAM-FILE
           MOVE 'SVC001_TXN_LGACDB01' TO WS-CFG-ENV-NAME
           PERFORM READ-ENV
           MOVE WS-CFG-ENV-VALUE TO WS-CFG-TXN-LGACDB01
           MOVE 'SVC001_LOG_QUEUE' TO WS-CFG-ENV-NAME
           PERFORM READ-ENV
           MOVE WS-CFG-ENV-VALUE TO WS-CFG-LOG-QUEUE
           MOVE 'SVC001_MQ_QUEUE' TO WS-CFG-ENV-NAME
           PERFORM READ-ENV
           MOVE WS-CFG-ENV-VALUE TO WS-CFG-MQ-QUEUE.
       LOAD-CONFIG-EXIT.
           EXIT.

       READ-ENV.
           MOVE SPACES TO WS-CFG-ENV-VALUE
           DISPLAY WS-CFG-ENV-NAME UPON ENVIRONMENT-NAME
           ACCEPT WS-CFG-ENV-VALUE FROM ENVIRONMENT-VALUE
               ON EXCEPTION MOVE SPACES TO WS-CFG-ENV-VALUE
           END-ACCEPT.
       READ-ENV-EXIT.
           EXIT.
