import { generateOfferLetterHtml } from './offerLetterTemplate';

describe('generateOfferLetterHtml', () => {
    it('should generate HTML with default fallback values when an empty offer object is provided', () => {
        const html = generateOfferLetterHtml({});
        expect(html).toContain('Company Name');
        expect(html).toContain('Company Address');
        expect(html).toContain('Candidate Name');
        expect(html).toContain('Designation');
        expect(html).toContain('<script>window.onload=function(){window.print()}</script>');
    });

    it('should generate HTML with provided offer details', () => {
        const offer = {
            id: '123',
            created_at: '2023-10-01T00:00:00.000Z',
            name: 'John Doe',
            designation: 'Software Engineer',
            phone: '1234567890',
            email: 'john.doe@example.com',
            ctc_yearly: 1200000,
            details: {
                location: 'Remote',
                company: {
                    name: 'Tech Corp',
                    address: '123 Tech Lane',
                    cin: 'U12345',
                    website: 'techcorp.com',
                    phone: '9876543210',
                    signatoryName: 'Jane Smith',
                    signatoryDesignation: 'CEO'
                },
                timeline: {
                    joiningDate: '2023-11-01T00:00:00.000Z',
                    workMode: 'Hybrid',
                    shift: '10 AM to 7 PM',
                    offerExpiry: '2023-10-15T00:00:00.000Z'
                },
                aadhaar: '1234 5678 9012',
                salaryBreakdown: [
                    { name: 'Basic Salary', final_value: 50000, type: 'earning' },
                    { name: 'HRA', final_value: 20000, type: 'earning' },
                    { name: 'PF', final_value: 3000, type: 'deduction' },
                    { name: 'Professional Tax', final_value: 200, type: 'deduction' }
                ],
                rulesAndRegs: 'Rule 1\nRule 2'
            }
        };

        const html = generateOfferLetterHtml(offer, false);

        // Assertions for company details
        expect(html).toContain('Tech Corp');
        expect(html).toContain('123 Tech Lane');
        expect(html).toContain('CIN: U12345');
        expect(html).toContain('techcorp.com');

        // Assertions for candidate details
        expect(html).toContain('John Doe');
        expect(html).toContain('Software Engineer');
        expect(html).toContain('1234567890');
        expect(html).toContain('john.doe@example.com');
        expect(html).toContain('1234 5678 9012');
        expect(html).toContain('Remote');

        // Assertions for timeline details
        expect(html).toContain('Hybrid');
        expect(html).toContain('10 AM to 7 PM');

        // Assertions for rules
        expect(html).toContain('<div class="section-text">Rule 1</div>');
        expect(html).toContain('<div class="section-text">Rule 2</div>');

        // Assertions for salary breakdown
        expect(html).toContain('Basic Salary');
        expect(html).toContain('HRA');
        expect(html).toContain('PF');
        expect(html).toContain('Professional Tax');
        // Total earnings = 50000 + 20000 = 70000
        expect(html).toContain('70,000');
        // Total deductions = 3000 + 200 = 3200
        expect(html).toContain('3,200');
        // Net Salary = 66800
        expect(html).toContain('66,800');

        // Print script included
        expect(html).toContain('<script>window.onload=function(){window.print()}</script>');
    });

    it('should NOT include window.print script when isPreview is true', () => {
        const html = generateOfferLetterHtml({}, true);
        expect(html).not.toContain('<script>window.onload=function(){window.print()}</script>');
    });
});
