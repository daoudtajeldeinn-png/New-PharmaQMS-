- [ ] Add targeted console verification for COA Foundry search by `batchNumber` (PA009) after sync (no UI changes).
- [ ] Investigate Dexie persistence for COA records: ensure `coaRecords` schema includes the fields that are later read (batchNumber, testResults, etc.).
- [ ] Fix cloud sync failure for `activities` (currently 400) so sync doesn’t corrupt subsequent pushes.
- [ ] After fixes, test: create COA with batchNumber=PA009, add testResult entries, save as draft and/or release.

