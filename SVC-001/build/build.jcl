//SVC001B  JOB (ACCT),'SVC-001 BUILD',CLASS=A,MSGCLASS=X,
//         NOTIFY=&SYSUID
//*--------------------------------------------------------------------
//* Compile (DB2 precompile + CICS translate) and link-edit the
//* SVC-001 programs. Dataset and subsystem names are JCL symbols
//* supplied at submit time (see config/svc001.env.example) - none
//* are hardcoded here.
//*   Usage: submit with  PROG=LGACDB01  (repeat per program)
//*--------------------------------------------------------------------
//         SET PROG=LGACDB01
//         SET HLQ=
//         SET SRCLIB=&HLQ..SVC001.COBOL
//         SET CPYLIB=&HLQ..SVC001.COPY
//         SET LOADLIB=&HLQ..SVC001.LOAD
//         SET DB2SUB=
//         SET DB2DBRM=&HLQ..SVC001.DBRMLIB
//         SET CICSHLQ=
//         SET DB2HLQ=
//         SET CEEHLQ=
//*
//CICSTRN  EXEC PROC=DFHYITVL,
//         INDEX='&CICSHLQ',
//         DSCTLIB='&CICSHLQ..SDFHCOB',
//         PROGLIB='&LOADLIB',
//         DSCTLIB2='&CPYLIB'
//TRN.SYSIN DD DISP=SHR,DSN=&SRCLIB(&PROG)
//*
//* TODO: replace the generic CICS proc above with the site's
//* compile/link procedure (DB2 precompile via DSNHPC with
//* SSID=&DB2SUB, DBRM to &DB2DBRM, COBOL compile, link-edit with
//* DFHECI and DSNCLI stubs into &LOADLIB(&PROG)). Site-specific
//* proc and library names are not in the supplied spec.
