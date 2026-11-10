      *****************************************************************
      * LGCFGWS - runtime configuration working storage               *
      * Values are loaded by LGCFGPR from LE environment variables    *
      * (CEEOPTS ENVAR) - nothing is hardcoded in source.             *
      *****************************************************************
       01  WS-CONFIG.
           03  WS-CFG-DB2-SUBSYS       PIC X(4)  VALUE SPACES.
           03  WS-CFG-VSAM-FILE        PIC X(8)  VALUE SPACES.
           03  WS-CFG-TXN-LGACDB01     PIC X(4)  VALUE SPACES.
           03  WS-CFG-LOG-QUEUE        PIC X(8)  VALUE SPACES.
           03  WS-CFG-MQ-QUEUE         PIC X(48) VALUE SPACES.
       01  WS-CFG-ENV-NAME             PIC X(32).
       01  WS-CFG-ENV-VALUE            PIC X(64).
