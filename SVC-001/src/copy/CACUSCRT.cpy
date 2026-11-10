      *****************************************************************
      * CACUSCRT - CA_CUSTOMER_CREATE COMMAREA (LGACDB01 interface)   *
      * Field order and lengths are a positional contract: DO NOT     *
      * ALTER. Total length is the version discriminator and must     *
      * equal WS-REQUIRED-CA-LEN.                                     *
      *****************************************************************
       01  CA-CUSTOMER-CREATE.
           03  CA-RETURN-CODE          PIC X(2).
           03  CA-CUSTOMER-NUM         PIC 9(10).
           03  CA-FIRST-NAME           PIC X(30).
           03  CA-LAST-NAME            PIC X(30).
           03  CA-DOB                  PIC X(10).
           03  CA-HOUSE-NAME           PIC X(30).
           03  CA-HOUSE-NUM            PIC X(6).
           03  CA-POSTCODE             PIC X(8).
           03  CA-PHONE-MOBILE         PIC X(20).
           03  CA-PHONE-HOME           PIC X(20).
           03  LGAC-NCS                PIC X(3).
           03  CA-DATA                 PIC X(90).
           03  CA-ERROR-MSG            PIC X(90).
