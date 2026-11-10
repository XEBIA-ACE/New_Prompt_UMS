       IDENTIFICATION DIVISION.
       PROGRAM-ID. LGACDB01.
      *****************************************************************
      * LGACDB01 - Customer Record Creation facade (SVC-001)          *
      * Sole entry point for callers. Orchestration order is fixed:   *
      *   1. validate COMMAREA length + mandatory fields              *
      *   2. DB2 CUSTOMER INSERT (10 columns, LGAC-NCS = 'ON')        *
      *   3. LINK LGACVS01  -> VSAM KSDSCUST WRITE                    *
      *   4. LINK LGACDB02 (D2-REQUEST-ID '02ACUS') -> CUSTOMER_SECURE*
      *   5. RC '00' only when all three writes succeeded             *
      * This program never writes CUSTOMER_SECURE directly.           *
      * SCAFFOLD STUB: steps 2-4 are not yet implemented.             *
      *****************************************************************
       ENVIRONMENT DIVISION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY LGCFGWS.
           COPY D2COMM.
           EXEC SQL INCLUDE SQLCA END-EXEC.

       01  WS-RETURN-CODES.
           03  WS-RC-OK                PIC X(2) VALUE '00'.
           03  WS-RC-SHORT-COMMAREA    PIC X(2) VALUE '98'.
      * TODO: failure-mode codes other than '00'/'98'/'99' are not
      * confirmed. Placeholder codes 01-09 in the spec examples must
      * be replaced with stakeholder-confirmed values; none invented.

      * TODO: WS-REQUIRED-CA-LEN exact value must be confirmed from
      * the authoritative COMMAREA definition. Derived from the
      * CACUSCRT copybook until then.
       01  WS-REQUIRED-CA-LEN          PIC S9(4) COMP.

       01  WS-STEP-SWITCHES.
           03  WS-DB2-CUSTOMER-OK      PIC X VALUE 'N'.
               88  DB2-CUSTOMER-WRITTEN      VALUE 'Y'.
           03  WS-VSAM-OK              PIC X VALUE 'N'.
               88  VSAM-WRITTEN              VALUE 'Y'.
           03  WS-CUSTSECR-OK          PIC X VALUE 'N'.
               88  CUSTSECR-WRITTEN          VALUE 'Y'.

       01  WS-SAVED-RC                 PIC X(2).
       01  WS-LINK-RESP                PIC S9(8) COMP.

       LINKAGE SECTION.
           COPY CACUSCRT REPLACING
               ==CA-CUSTOMER-CREATE== BY ==DFHCOMMAREA==.

       PROCEDURE DIVISION.
       MAINLINE.
           PERFORM LOAD-CONFIG
           MOVE LENGTH OF CA-CUSTOMER-CREATE TO WS-REQUIRED-CA-LEN

      * TODO: enforce RACF authorisation on the LGACDB01 transaction
      * ID (EXEC CICS QUERY SECURITY / resource profile) - RC TBC.

           IF EIBCALEN < WS-REQUIRED-CA-LEN
               MOVE WS-RC-SHORT-COMMAREA TO CA-RETURN-CODE
               PERFORM RETURN-TO-CALLER
           END-IF

           PERFORM VALIDATE-MANDATORY-FIELDS
           PERFORM INSERT-DB2-CUSTOMER
           PERFORM LINK-LGACVS01
           PERFORM LINK-LGACDB02

           IF DB2-CUSTOMER-WRITTEN AND VSAM-WRITTEN
              AND CUSTSECR-WRITTEN
               MOVE WS-RC-OK TO CA-RETURN-CODE
           END-IF
           PERFORM RETURN-TO-CALLER.

       VALIDATE-MANDATORY-FIELDS.
      * TODO: mandatory field list and failure RC not confirmed.
           CONTINUE.

       INSERT-DB2-CUSTOMER.
      * TODO: EXEC SQL INSERT INTO CUSTOMER with all 10 columns and
      * LGAC-NCS = 'ON'. 10th column definition is TBC (COL10_TBC)
      * pending confirmed DDL. Behaviour when LGAC-NCS is not 'ON'
      * needs stakeholder confirmation.
      * TODO: retry limits for transient DB2 errors (deadlock) and
      * idempotency check; rollback vs compensating DELETE strategy
      * (SYNCPOINT ROLLBACK) to be confirmed.
           CONTINUE.

       LINK-LGACVS01.
      * TODO: EXEC CICS LINK PROGRAM('LGACVS01') COMMAREA(...) once
      * the VSAM KSDSCUST record layout is confirmed.
           CONTINUE.

       LINK-LGACDB02.
      * TODO: MOVE '02ACUS' TO D2-REQUEST-ID, set D2-CUSTOMER-NUM,
      * EXEC CICS LINK PROGRAM('LGACDB02') COMMAREA(D2-COMMAREA).
           CONTINUE.

       WRITE-ERROR-LOG.
      * Non-fatal logging contract: CA-RETURN-CODE is identical before
      * and after the LGSTSQ LINK; any LGSTSQ failure is absorbed.
           MOVE CA-RETURN-CODE TO WS-SAVED-RC
           IF EIBCALEN > 0 AND EIBCALEN < 91
               MOVE DFHCOMMAREA(1:EIBCALEN) TO CA-DATA
           END-IF
           EXEC CICS LINK PROGRAM('LGSTSQ')
                COMMAREA(CA-DATA)
                LENGTH(LENGTH OF CA-DATA)
                RESP(WS-LINK-RESP)
           END-EXEC
           MOVE WS-SAVED-RC TO CA-RETURN-CODE.

       RETURN-TO-CALLER.
           EXEC CICS RETURN END-EXEC.

           COPY LGCFGPR.
