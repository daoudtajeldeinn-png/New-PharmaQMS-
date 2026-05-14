# GMP Compliance Fixes & Features

## Confirmed Issues
1. **Raw Materials**: Add productionDate/manufacturingDate (not just receivedDate)
2. **COA/IPQC/BMR**: Add analysisDate, issueDate display/print
3. **Water COA**: Add Heavy Metals, Nitrate, Aluminum tests + auto-load
4. **Line Clearance**: Activate checklist in BMR/MFR
5. **Test Flow**: Raw/IPQC tests auto-populate in COA/IPQC reports
6. **PDF Methods**: Upload PDF → auto-tests → COA
7. **Rebuild**: Final electron .exe

## Step-by-Step Plan
1. [ ] Update types (add date fields)
2. [ ] Update MaterialInventory (add productionDate input)
3. [ ] Update COAManager (dates, water tests)
4. [ ] Add water tests (g1Data.ts)
5. [ ] BMRManager: Line clearance + analysis dates
6. [ ] PDF upload feature
7. [ ] `npm run electron:build`

**Proceed with edits?**

