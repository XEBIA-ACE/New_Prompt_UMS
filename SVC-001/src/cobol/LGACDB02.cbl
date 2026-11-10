       IDENTIFICATION DIVISION.
       PROGRAM-ID. LGACDB02.
      *****************************************************************
      * LGACDB02 - DB2 CUSTOMER_SECURE writer (SVC-001)               *
      * The only program authorised to write CUSTOMER_SECURE.         *
      * Only D2-REQUEST-ID '02ACUS' reaches INSERT-CUSTOMER-PASSWORD; *
      * any other value returns D2-RETURN-CODE '99' with no INSERT.   *
      *****************************************************************
       ENVIRONMENT DIVISION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY LGCFGWS.
           EXEC SQL INCLUDE SQLCA END-EXEC.

       LINKAGE SECTION.
           COPY D2COMM REPLACING
               ==D2-COMMAREA== BY ==DFHCOMMAREA==.

       PROCEDURE DIVISION.
       MAINLINE.
           PERFORM LOAD-CONFIG
           IF D2-REQUEST-ID = '02ACUS'
               PERFORM INSERT-CUSTOMER-PASSWORD
           ELSE
               MOVE '99' TO D2-RETURN-CODE
           END-IF
           EXEC CICS RETURN END-EXEC.

       INSERT-CUSTOMER-PASSWORD.
           PERFORM COMPUTE-BD5-CHECKSUM
      * TODO: EXEC SQL INSERT INTO CUSTOMER_SECURE. The 4th column
      * definition is TBC (COL4_TBC). Success RC and failure RCs TBC;
      * D2-RETURN-CODE is deliberately left unset until confirmed so
      * the stub can never report success.
           CONTINUE.

       COMPUTE-BD5-CHECKSUM.
      * TODO: BD5 checksum algorithm, input value and output length
      * are open items. A checksum failure must surface as a distinct
      * error condition (RC TBC). D2-BD5-PASSWORD must never be logged.
           CONTINUE.

           COPY LGCFGPR.
