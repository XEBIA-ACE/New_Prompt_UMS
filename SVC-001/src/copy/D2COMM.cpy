      *****************************************************************
      * D2COMM - D2_COMMAREA (LGACDB02 interface)                     *
      * D2-REQUEST-ID must be '02ACUS' to reach the                   *
      * INSERT-CUSTOMER-PASSWORD path; any other value returns '99'.  *
      *****************************************************************
       01  D2-COMMAREA.
           03  D2-REQUEST-ID           PIC X(6).
           03  D2-RETURN-CODE          PIC X(2).
           03  D2-CUSTOMER-NUM         PIC 9(10).
           03  D2-CUSTSECR-COUNT       PIC 9(4).
           03  D2-BD5-PASSWORD         PIC X(8).
