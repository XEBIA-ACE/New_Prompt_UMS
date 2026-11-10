      *****************************************************************
      * LGSTSQC - LGSTSQ_COMMAREA (non-fatal logging program)         *
      * TODO: layout not defined in the available spec material; the  *
      * caller contract only states that DFHCOMMAREA(1:EIBCALEN) is   *
      * moved to CA-DATA (90 bytes) when 0 < EIBCALEN < 91. Confirm   *
      * with stakeholders. No personal data may be logged beyond what *
      * LGSTSQ is explicitly specified to write.                      *
      *****************************************************************
       01  LGSTSQ-COMMAREA.
           03  LQ-MESSAGE              PIC X(90).
