#!/usr/bin/env bash
# Static AC-1 verification + COBOL format lint for SVC-001 (no compiler needed).
# Usage: SVC-001/scripts/verify-ac1.sh
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
check() { if ! eval "$2"; then echo "FAIL: $1"; fail=1; else echo "ok:   $1"; fi; }

cd "$root/src" || exit 2
progs="LGACDB01 LGACVS01 LGACDB02 LGSTSQ LGHLTH01"

# Format lint: <=72 columns, no tabs
check "no source line exceeds column 72" \
  '! grep -rEn "^.{73,}$" cobol copy'
check "no tabs in source" '! grep -rnP "\t" cobol copy'

# Four programs present with all four divisions and a PROGRAM-ID
for p in $progs; do
  f="cobol/$p.cbl"
  check "$p has all four divisions" \
    "[ -f $f ] && grep -q 'IDENTIFICATION DIVISION' $f && grep -q 'ENVIRONMENT DIVISION' $f && grep -q 'DATA DIVISION' $f && grep -q 'PROCEDURE DIVISION' $f && grep -q 'PROGRAM-ID. $p\\.' $f"
done

# COMMAREA contract: exact field order and PICs
ca="CA-RETURN-CODE:X(2) CA-CUSTOMER-NUM:9(10) CA-FIRST-NAME:X(30) CA-LAST-NAME:X(30) CA-DOB:X(10) CA-HOUSE-NAME:X(30) CA-HOUSE-NUM:X(6) CA-POSTCODE:X(8) CA-PHONE-MOBILE:X(20) CA-PHONE-HOME:X(20) LGAC-NCS:X(3) CA-DATA:X(90) CA-ERROR-MSG:X(90)"
d2="D2-REQUEST-ID:X(6) D2-RETURN-CODE:X(2) D2-CUSTOMER-NUM:9(10) D2-CUSTSECR-COUNT:9(4) D2-BD5-PASSWORD:X(8)"
contract() { # file "name:pic ..."
  local got want=""
  got=$(grep -E '^ +03 ' "$1" | sed -E 's/^ +03 +([A-Z0-9-]+) +PIC +([^ .]+)\.?.*/\1:\2/' | tr '\n' ' ')
  for x in $2; do want="$want$x "; done
  [ "$got" = "$want" ]
}
check "CA_CUSTOMER_CREATE layout matches contract" "contract copy/CACUSCRT.cpy '$ca'"
check "D2_COMMAREA layout matches contract" "contract copy/D2COMM.cpy '$d2'"
check "LGSTSQ_COMMAREA copybook present" "[ -f copy/LGSTSQC.cpy ]"

# Hardcoded names / secrets in executable (non-comment) source
exec_lines() { grep -hvE '^.{6}[*]' cobol/*.cbl copy/*.cpy; }
check "no hardcoded KSDSCUST/DB2 subsystem literal" \
  '! exec_lines | grep -E "FILE\(.KSDSCUST|SSID|VALUE .(DB2|DSN)[A-Z0-9]{0,2}."'
check "no credentials/endpoints in source" \
  '! grep -rniE "password *= *.[^ ]|secret|api[-_]?key|https?://" cobol copy | grep -vE "^[^:]+:[0-9]+:.{6}[*]|D2-BD5-PASSWORD"'

# Security contracts
check "LGACDB01 never writes CUSTOMER_SECURE" \
  '! grep -vE "^.{6}[*]" cobol/LGACDB01.cbl | grep -qi "INTO CUSTOMER_SECURE"'
check "LGACDB02 rejects non-02ACUS with RC 99" \
  "grep -q \"MOVE '99' TO D2-RETURN-CODE\" cobol/LGACDB02.cbl"
check "no other COMMAREA return-code literals invented" \
  "! grep -hE \"TO (CA|D2)-RETURN-CODE\" cobol/*.cbl | grep -vE \"'(00|98|99)'\" | grep -v WS-"

[ $fail -eq 0 ] && echo "AC-1 static checks PASSED" || echo "AC-1 static checks FAILED"
exit $fail
