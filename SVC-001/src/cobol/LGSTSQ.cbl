       IDENTIFICATION DIVISION.
       PROGRAM-ID. LGSTSQ.
      *****************************************************************
      * LGSTSQ - non-fatal logging program (SVC-001)                  *
      * Failures here must be silently absorbed by the caller and     *
      * must never override the primary return code.                  *
      * SCAFFOLD STUB: queue write not yet implemented.               *
      *****************************************************************
       ENVIRONMENT DIVISION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY LGCFGWS.

       LINKAGE SECTION.
           COPY LGSTSQC REPLACING
               ==LGSTSQ-COMMAREA== BY ==DFHCOMMAREA==.

       PROCEDURE DIVISION.
       MAINLINE.
           PERFORM LOAD-CONFIG
      * TODO: EXEC CICS WRITEQ with the queue name from
      * WS-CFG-LOG-QUEUE (never a literal), RESP-checked and
      * ignored on failure. Message content is limited to what the
      * spec explicitly permits - no names, DOB, address, credentials.
           EXEC CICS RETURN END-EXEC.

           COPY LGCFGPR.
