create work order form using input below:-

1. work Order ID (system-generated)

2. Work Type (dropdown) (Preventive, Complaint, Job, Repair)

3. asset_id (dropdown) - follow asset listing.

4. location - auto fill based on asset_id

5. Status Progress (dropdown) (active, In Progress, Review, Done) 

6. Priority (dropdown) (High, Medium, Low)

7. Title / Summary

8. Description (detailed work instructions or issue report)

9. Created Date & Time (system timestamp)

10. Due Date (put in date picker)

11. Requested By (from logged in user)

12. Assigned person / Team (dropdown) - follow profile listing.

13. add Preventive-specific Fields (only if Work Type = Preventive)

    - Recurrence Rule (RRULE) (e.g., FREQ=MONTHLY;INTERVAL=1)
    - Start Date of Recurrence
    - End Date or Number of Occurrences
    - Next Scheduled Date (auto-calculated)

14. add specific field (only if Work Type = Job)
    - Job Type (dropdown) (Cleaning, Maintenance, Repair)
    - service provider (dropdown) - follow contacts listing.
    - contact person, number, email - auto filled from service provider
    
    reference - text input.

15. add specific field (only if Work Type = Repair)
    - unit number
    - contact person (nullable)
    - contact number (nullable)
    - contact email (nullable)
    - 


frontend section

1. create simple dashboard to display work order listing with filter by work type, status, priority, and date range.

2. create card with horizontal bar to display work order per user.

3. create job toast notification for work order that is due within 3 days

4. create modal to add/edit work order.

5. create modal to view work order details.

6. in dashboard page, create 3 tab sections, active, for review and completed.

7. when status is active and in progress, it will be displayed in the active tab.

8. when status is review, it will be displayed in the for review tab.

9. when status is done, it will be displayed in the completed tab.

10. job created within 24 hours will have tag 'new'.

11. create modal to view work order history.


backend section

1. create table work_orders - follow input from the form.

2. create function to generate work order 

sidebar section

1. create work order management menu and route.


