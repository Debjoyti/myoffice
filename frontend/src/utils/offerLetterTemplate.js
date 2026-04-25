export const generateOfferLetterHtml = (offer, isPreview = false) => {
    const details = offer.details || {};
    const salary = Array.isArray(details.salaryBreakdown) ? details.salaryBreakdown : [];

    // Data Prep
    const companyName = details.company?.name || 'Company Name';
    const companyAddress = details.company?.address || 'Company Address';
    const companyCIN = details.company?.cin || '';
    const companyWebsite = details.company?.website || '';
    const companyPhone = details.company?.phone || '';

    const candidateName = offer.name || 'Candidate Name';
    const designation = offer.designation || 'Designation';
    const hashId = btoa((offer.id || '') + (offer.created_at || '')).substring(0, 32).toUpperCase();
    const offerDate = new Date(offer.created_at || new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const joiningDate = details.timeline?.joiningDate ? new Date(details.timeline.joiningDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';
    const workMode = details.timeline?.workMode || 'Work from Office';
    const location = details.location || 'Base Location';
    const rulesAndRegs = details.rulesAndRegs || '';
    const signatoryName = details.company?.signatoryName || 'Authorized Signatory';
    const signatoryDesignation = details.company?.signatoryDesignation || 'Human Resources';

    // Salary Categorization
    const fixed = salary.filter(c => ['Basic Pay', 'HRA', 'Other Allowance', 'Bonus', 'Special Allowance', 'Food Allowance', 'Basic Salary', 'House Rent Allowance'].some(n => c.name.includes(n)) && c.type !== 'deduction');
    const deductions = salary.filter(c => c.type === 'deduction' || ['PF', 'Provident', 'ESI', 'Professional Tax', 'Income Tax IT'].some(n => c.name.includes(n)));

    const sumVal = (arr) => arr.reduce((acc, curr) => acc + (curr.final_value || 0), 0);
    const fixedTotal = sumVal(fixed);
    const deductionsTotal = sumVal(deductions);
    const ctcYearly = (offer.ctc_yearly || 0);

    // Format rules and regulations
    const formattedRules = rulesAndRegs
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<div class="section-text">${line}</div>`)
        .join('');

    return `<!DOCTYPE html>
<html>
<head>
    <title>Offer Letter - ${candidateName}</title>
    <style>
        @page { margin: 25mm 20mm; }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333333;
            padding-bottom: 50px;
            max-width: 800px;
            margin: 0 auto;
        }

        /* Header styles */
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24pt;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .company-details {
            font-size: 9.5pt;
            color: #666;
            line-height: 1.4;
        }

        /* Meta info section */
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 10.5pt;
        }
        .date-box { text-align: right; }

        /* Address box */
        .address-box {
            margin-bottom: 30px;
        }
        .candidate-name { font-weight: bold; font-size: 12pt; }

        /* Subject line */
        .subject-line {
            font-weight: bold;
            margin-bottom: 25px;
            padding: 10px;
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
        }

        /* Salutation */
        .salutation { margin-bottom: 20px; }

        /* Sections */
        .section-title {
            font-weight: bold;
            font-size: 11.5pt;
            color: #1e3a8a;
            margin: 25px 0 10px 0;
            text-transform: uppercase;
        }
        .section-text {
            margin-bottom: 15px;
            text-align: justify;
        }

        /* Compensation Table */
        .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
        }
        .salary-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 10px 15px;
            text-align: left;
            border: 1px solid #cbd5e1;
            font-weight: bold;
        }
        .salary-table td {
            border: 1px solid #cbd5e1;
            padding: 8px 15px;
            vertical-align: middle;
        }
        .bg-light { background-color: #f8fafc; font-weight: 600; }
        .row-total { background-color: #e2e8f0; font-weight: bold; }

        /* Signature block */
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            page-break-inside: avoid;
        }
        .sign-box { width: 40%; }
        .sign-line {
            border-top: 1px solid #000;
            margin-top: 60px;
            padding-top: 8px;
            font-size: 10pt;
        }
        .sign-name { font-weight: bold; font-size: 11pt; margin-bottom: 3px; }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            text-align: center;
            border-top: 1px solid #cbd5e1;
            padding-top: 15px;
            font-size: 8.5pt;
            color: #64748b;
            background: #fff;
        }

        /* Utilities */
        .bold { font-weight: bold; }
        .page-break { page-break-before: always; }

        @media print {
            .footer { position: fixed; bottom: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="company-name">${companyName}</h1>
        <div class="company-details">
            ${companyAddress}<br>
            ${companyCIN ? `CIN: ${companyCIN} | ` : ''}${companyPhone ? `Tel: ${companyPhone} | ` : ''}${companyWebsite}
        </div>
    </div>

    <div class="meta-info">
        <div><span class="bold">Ref No:</span> ${hashId.substring(0, 8)}</div>
        <div class="date-box"><span class="bold">Date:</span> ${offerDate}</div>
    </div>

    <div class="address-box">
        <div class="candidate-name">To,</div>
        <div class="candidate-name">${candidateName}</div>
        <div>Phone: ${offer.phone || 'N/A'}</div>
        <div>Email: ${offer.email || 'N/A'}</div>
        ${details.aadhaar ? `<div>Aadhaar: ${details.aadhaar}</div>` : ''}
    </div>

    <div class="subject-line">
        Subject: Offer of Employment - ${designation}
    </div>

    <div class="salutation">Dear ${candidateName},</div>

    <div class="section-text">
        Following our recent discussions, we are delighted to extend this formal offer of employment to join <span class="bold">${companyName}</span> (hereinafter referred to as the "Company"). We are impressed by your background and skills, and we believe you will be a valuable addition to our team.
    </div>

    <div class="section-text">
        You are being offered the position of <span class="bold">${designation}</span>. Your employment terms are set forth below:
    </div>

    <div class="section-title">1. Commencement and Location</div>
    <div class="section-text">
        Your employment with the Company will commence on or before <span class="bold">${joiningDate}</span>.
        Your primary place of work will be <span class="bold">${location}</span>, and your work arrangement is designated as <span class="bold">${workMode}</span>.
        ${details.timeline?.shift ? `Your standard shift timings will be ${details.timeline.shift}, subject to business requirements.` : ''}
    </div>

    <div class="section-title">2. Compensation Details</div>
    <div class="section-text">
        Your Annual Cost to Company (CTC) will be <span class="bold">INR ${Number(ctcYearly).toLocaleString('en-IN')}</span> per annum.
        A detailed breakdown of your compensation is provided below. All payments are subject to statutory deductions and applicable taxes as per the Income Tax Act, 1961.
    </div>

    <table class="salary-table">
        <thead>
            <tr>
                <th width="70%">Salary Components</th>
                <th width="30%">Monthly Amount (INR)</th>
            </tr>
        </thead>
        <tbody>
            <tr class="bg-light">
                <td colspan="2">A. Earnings</td>
            </tr>
            ${fixed.map(c => `<tr><td>${c.name}</td><td>₹ ${Math.round(c.final_value).toLocaleString('en-IN')}</td></tr>`).join('')}
            <tr class="row-total">
                <td>Total Earnings (A)</td>
                <td>₹ ${Math.round(fixedTotal).toLocaleString('en-IN')}</td>
            </tr>

            <tr class="bg-light">
                <td colspan="2">B. Deductions</td>
            </tr>
            ${deductions.map(c => `<tr><td>${c.name}</td><td>₹ ${Math.round(c.final_value).toLocaleString('en-IN')}</td></tr>`).join('')}
            <tr class="row-total">
                <td>Total Deductions (B)</td>
                <td>₹ ${Math.round(deductionsTotal).toLocaleString('en-IN')}</td>
            </tr>

            <tr class="row-total" style="background-color: #dbeafe; color: #1e3a8a;">
                <td>Net Monthly Salary (A - B)</td>
                <td>₹ ${Math.round(fixedTotal - deductionsTotal).toLocaleString('en-IN')}</td>
            </tr>
        </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">3. Employment Policies and Terms</div>
    ${formattedRules || `
    <div class="section-text">
        <strong>a. Probation Period:</strong> You will be on probation for a period of six (6) months from your date of joining. Upon satisfactory performance, your employment will be confirmed in writing.
    </div>
    <div class="section-text">
        <strong>b. Leave Policy:</strong> You will be entitled to leaves as per the Company's Leave Policy, which may be amended from time to time at the Company's sole discretion.
    </div>
    <div class="section-text">
        <strong>c. Code of Conduct:</strong> You are expected to abide by the Company's Code of Conduct and maintain the highest standards of professional ethics.
    </div>
    <div class="section-text">
        <strong>d. Confidentiality:</strong> During your employment and thereafter, you shall strictly maintain the confidentiality of all proprietary and confidential information of the Company and its clients.
    </div>
    <div class="section-text">
        <strong>e. Background Verification:</strong> This offer and your continued employment are contingent upon the successful completion of a background verification process.
    </div>
    <div class="section-text">
        <strong>f. Termination:</strong> During probation, your employment may be terminated by either party with a 15-day notice period. After confirmation, the notice period will be subject to the Company's standard termination policy.
    </div>
    `}

    <div class="section-title">4. Acceptance</div>
    <div class="section-text">
        Please indicate your acceptance of this offer by signing the duplicate copy of this letter and returning it to the HR Department on or before <span class="bold">${details.timeline?.offerExpiry ? new Date(details.timeline.offerExpiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '7 days from the date of this letter'}</span>.
        If we do not receive your acceptance by this date, this offer will automatically be deemed withdrawn.
    </div>

    <div class="section-text" style="margin-top: 30px;">
        We welcome you to <span class="bold">${companyName}</span> and look forward to a long and mutually beneficial association.
    </div>

    <div class="signature-section">
        <div class="sign-box">
            <div class="bold" style="margin-bottom: 15px;">For ${companyName}</div>
            <div class="sign-line">
                <div class="sign-name">${signatoryName}</div>
                <div>${signatoryDesignation}</div>
                <div style="margin-top: 5px;">Date: ${offerDate}</div>
            </div>
        </div>
        <div class="sign-box">
            <div class="bold" style="margin-bottom: 15px;">Accepted and Agreed</div>
            <div class="sign-line">
                <div class="sign-name">${candidateName}</div>
                <div>Signature</div>
                <div style="margin-top: 5px;">Date: ___________</div>
            </div>
        </div>
    </div>

    <div class="footer">
        ${companyName} ${companyCIN ? ` | CIN: ${companyCIN}` : ''}<br>
        ${companyAddress}<br>
        Doc ID: ${hashId} | Generated on: ${new Date().toLocaleString('en-US')}
    </div>

    ${isPreview ? "" : "<script>window.onload=function(){window.print()}</script>"}
</body>
</html>`;
};
