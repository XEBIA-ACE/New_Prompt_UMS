       IDENTIFICATION DIVISION.
       PROGRAM-ID. LGHLTH01.
      *****************************************************************
      * LGHLTH01 - GET /health backend (SVC-001), no authentication.  *
      * Fills HealthResponse; z/OS Connect EE maps it to JSON and     *
      * returns HTTP 200 when status is UP, otherwise HTTP 503.       *
      *****************************************************************
       ENVIRONMENT DIVISION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY LGCFGWS.

       01  WS-ABSTIME                  PIC S9(15) COMP-3.
       01  WS-DATE                     PIC X(10).
       01  WS-TIME                     PIC X(8).
       01  WS-RESP                     PIC S9(8) COMP.
       01  WS-OPEN-STATUS              PIC S9(8) COMP.

       LINKAGE SECTION.
           COPY LGHLTHC REPLACING
               ==HEALTH-RESPONSE== BY ==DFHCOMMAREA==.

       PROCEDURE DIVISION.
       MAINLINE.
           PERFORM LOAD-CONFIG
           MOVE 'SVC-001' TO HR-SERVICE-ID
           PERFORM SET-TIMESTAMP
           PERFORM CHECK-SUBSYSTEMS
           PERFORM DERIVE-STATUS
           EXEC CICS RETURN END-EXEC.

       SET-TIMESTAMP.
      * TODO: ISO 8601 output assumes the CICS clock is UTC; confirm.
           EXEC CICS ASKTIME ABSTIME(WS-ABSTIME) END-EXEC
           EXEC CICS FORMATTIME ABSTIME(WS-ABSTIME)
                YYYYMMDD(WS-DATE) DATESEP('-')
                TIME(WS-TIME) TIMESEP(':')
           END-EXEC
           STRING WS-DATE 'T' WS-TIME DELIMITED BY SIZE
               INTO HR-TIMESTAMP.

       CHECK-SUBSYSTEMS.
      * This program is running under CICS, so CICS TS is up.
           MOVE 'UP' TO HR-CICS-TS
      * TODO: DB2 probes for CUSTOMER and CUSTOMER_SECURE need the
      * confirmed DDL (COL10_TBC / COL4_TBC) - reported UNKNOWN.
           MOVE 'UNKNOWN' TO HR-DB2-CUSTOMER
           MOVE 'UNKNOWN' TO HR-DB2-CUSTOMER-SECURE
           MOVE 'UNKNOWN' TO HR-VSAM-KSDSCUST
           IF WS-CFG-VSAM-FILE NOT = SPACES
               EXEC CICS INQUIRE FILE(WS-CFG-VSAM-FILE)
                    OPENSTATUS(WS-OPEN-STATUS)
                    RESP(WS-RESP)
               END-EXEC
               IF WS-RESP = DFHRESP(NORMAL)
                   IF WS-OPEN-STATUS = DFHVALUE(OPEN)
                       MOVE 'UP' TO HR-VSAM-KSDSCUST
                   ELSE
                       MOVE 'DOWN' TO HR-VSAM-KSDSCUST
                   END-IF
               ELSE
                   MOVE 'DOWN' TO HR-VSAM-KSDSCUST
               END-IF
           END-IF.

       DERIVE-STATUS.
           EVALUATE TRUE
               WHEN HR-DB2-CUSTOMER = 'UP'
                AND HR-DB2-CUSTOMER-SECURE = 'UP'
                AND HR-VSAM-KSDSCUST = 'UP'
                AND HR-CICS-TS = 'UP'
                   MOVE 'UP' TO HR-STATUS
               WHEN HR-DB2-CUSTOMER = 'DOWN'
                 OR HR-DB2-CUSTOMER-SECURE = 'DOWN'
                 OR HR-VSAM-KSDSCUST = 'DOWN'
                 OR HR-CICS-TS = 'DOWN'
                   MOVE 'DOWN' TO HR-STATUS
               WHEN OTHER
                   MOVE 'DEGRADED' TO HR-STATUS
           END-EVALUATE.

           COPY LGCFGPR.
