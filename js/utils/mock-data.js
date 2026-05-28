/* ==========================================================================
   SEED DATA — UNIVERSITY OF SRI JAYEWARDENEPURA (js/utils/mock-data.js)
   ========================================================================== */

window.DocTrackMockData = {
    university: {
        id: 'university',
        name: 'University of Sri Jayewardenepura',
        icon: 'fa-graduation-cap',
        themeClass: 'domain-university',
        departments: [
            { id: 'admissions', name: 'Admissions Office', targetTime: 24, load: 35 },
            { id: 'faculty', name: 'Faculty Dean Office', targetTime: 48, load: 50 },
            { id: 'senate', name: 'Senate Committee', targetTime: 72, load: 20 },
            { id: 'finance', name: 'Finance Department', targetTime: 24, load: 65 },
            { id: 'registry', name: 'Student Registry', targetTime: 12, load: 15 }
        ],
        workflows: [
            {
                id: 'wf-admission',
                name: 'Undergraduate Admission Processing',
                stages: ['admissions', 'faculty', 'finance', 'registry']
            },
            {
                id: 'wf-grant',
                name: 'Research Grant Review',
                stages: ['faculty', 'senate', 'finance', 'registry']
            }
        ],
        documents: [
            {
                id: 'DOC-2026-UNI-4890',
                name: 'Research Funding Request (AS2023376)',
                workflowId: 'wf-grant',
                priority: 'high',
                status: 'Under Review',
                currentStage: 'senate',
                createdAt: '2026-05-25T09:30:00Z',
                lastUpdate: '2026-05-28T14:20:00Z',
                metadata: {
                    'Principal Investigator': 'Y M N D Disanayaka',
                    'Funding Agency': 'National Science Foundation',
                    'Budget Requested': 'LKR 4,500,000',
                    'Department': 'Computer Science'
                },
                timeline: [
                    { stage: 'faculty', status: 'Completed', officer: 'Prof. G. K. Karunaratne', timestamp: '2026-05-25T10:00:00Z', comment: 'Approved at Faculty Board level. Forwarding to Senate for academic clearance.' },
                    { stage: 'senate', status: 'Active', officer: 'Registrar Dean Office', timestamp: '2026-05-26T11:15:00Z', comment: 'Placed on Senate Agenda. Awaiting final committee vote.' }
                ]
            },
            {
                id: 'DOC-2026-UNI-1102',
                name: 'Foreign Degree Registration Approval',
                workflowId: 'wf-admission',
                priority: 'medium',
                status: 'Delayed',
                currentStage: 'finance',
                createdAt: '2026-05-20T08:10:00Z',
                lastUpdate: '2026-05-27T10:45:00Z',
                metadata: {
                    'Applicant Name': 'D M O Sasanka',
                    'Foreign University': 'University of Melbourne',
                    'Verification Status': 'Verified',
                    'Registration Fee': 'LKR 25,000'
                },
                timeline: [
                    { stage: 'admissions', status: 'Completed', officer: 'Mr. A. L. Silva', timestamp: '2026-05-20T09:15:00Z', comment: 'Application reviewed. Documents authentic.' },
                    { stage: 'faculty', status: 'Completed', officer: 'Dr. T. M. Fernando', timestamp: '2026-05-22T14:30:00Z', comment: 'Syllabus alignment verified. 30 credits transferred.' },
                    { stage: 'finance', status: 'Delayed', officer: 'Mrs. S. Weerasinghe', timestamp: '2026-05-24T10:00:00Z', comment: 'Awaiting copy of bank transfer slip from student. Stalled for 72+ hours.' }
                ]
            },
            {
                id: 'DOC-2026-UNI-7741',
                name: 'Special Needs Exam Accommodations',
                workflowId: 'wf-admission',
                priority: 'high',
                status: 'Completed',
                currentStage: 'registry',
                createdAt: '2026-05-28T07:00:00Z',
                lastUpdate: '2026-05-28T16:50:00Z',
                metadata: {
                    'Student Index': 'W M H Dileesha',
                    'Accomm. Type': 'Extra Time (30 mins)',
                    'Medical Certificate': 'Verified'
                },
                timeline: [
                    { stage: 'admissions', status: 'Completed', officer: 'Mr. A. L. Silva', timestamp: '2026-05-28T07:15:00Z', comment: 'Request registered. Medical docs attached.' },
                    { stage: 'faculty', status: 'Completed', officer: 'Dr. T. M. Fernando', timestamp: '2026-05-28T09:40:00Z', comment: 'Approved by faculty exam coordinator.' },
                    { stage: 'finance', status: 'Completed', officer: 'System Exemption', timestamp: '2026-05-28T11:00:00Z', comment: 'Fee waived automatically.' },
                    { stage: 'registry', status: 'Completed', officer: 'Ms. Priyanthi', timestamp: '2026-05-28T16:50:00Z', comment: 'Alternative hall scheduled. Notification sent to student.' }
                ]
            }
        ]
    }
};
