      *****************************************************************
      * LGHLTHC - HealthResponse COMMAREA for GET /health             *
      * status: UP / DOWN / DEGRADED; subsystems: UP / DOWN / UNKNOWN *
      *****************************************************************
       01  HEALTH-RESPONSE.
           03  HR-STATUS               PIC X(8).
           03  HR-SERVICE-ID           PIC X(7).
           03  HR-TIMESTAMP            PIC X(19).
           03  HR-SUBSYSTEMS.
               05  HR-DB2-CUSTOMER         PIC X(7).
               05  HR-DB2-CUSTOMER-SECURE  PIC X(7).
               05  HR-VSAM-KSDSCUST        PIC X(7).
               05  HR-CICS-TS              PIC X(7).
