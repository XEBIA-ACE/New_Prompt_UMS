       IDENTIFICATION DIVISION.
       PROGRAM-ID. LGACVS01.
      *****************************************************************
      * LGACVS01 - VSAM KSDSCUST writer (SVC-001)                     *
      * The only program with write authority to KSDSCUST. Invoked by *
      * LGACDB01 via CICS LINK inside the active unit of work.        *
      * SCAFFOLD STUB: EXEC CICS WRITE FILE not yet implemented.      *
      *****************************************************************
       ENVIRONMENT DIVISION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY LGCFGWS.

      * TODO: KSDSCUST maximum record length and full field layout
      * must be confirmed against the existing cluster definition
      * before the record area and WRITE can be defined.

       LINKAGE SECTION.
           COPY CACUSCRT REPLACING
               ==CA-CUSTOMER-CREATE== BY ==DFHCOMMAREA==.

       PROCEDURE DIVISION.
       MAINLINE.
           PERFORM LOAD-CONFIG
      * TODO: EXEC CICS WRITE FILE(WS-CFG-VSAM-FILE) FROM(...)
      * RIDFLD(...) once the layout is confirmed. File name comes
      * from configuration; never a literal. Retry limits for NOSPACE
      * and idempotency on DUPREC to be defined; RCs TBC.
           EXEC CICS RETURN END-EXEC.

           COPY LGCFGPR.
