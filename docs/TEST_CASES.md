Hackathon Test Cases (Link3d-Memory v2)

These are the simple test cases for our hackathon MVR.

Setup

Install the extension as "unpacked."

Authorize Google when prompted.

TC-01: New Contact Workflow (State A)

Objective: Verify a new contact is created correctly with the AI-generated memory.

Precondition: The person on the LinkedIn profile does not exist in your Google Contacts.

Steps:

Navigate to the LinkedIn profile.

Click the Link3d extension icon.

The popup should display the "New Contact" UI.

Verify the Name, Title, and AI Memory are displayed.

Click the Create Contact button.

Expected Result:

A "Success" message appears in the popup.

A new contact is created in Google Contacts.

The Google Contact record contains the correct Name, Job Title, LinkedIn Profile URL, and the AI Memory in the "Notes" field.

TC-02: Existing Contact Workflow (State B)

Objective: Verify a new "memory" is appended to an existing contact.

Precondition: The person on the LinkedIn profile already exists in your Google Contacts.

Steps:

Navigate to the LinkedIn profile of the existing contact.

Click the Link3d extension icon.

The popup should display the "Existing Contact Found!" UI.

Verify the new AI Memory is displayed.

Click the Add Memory to Contact button.

Expected Result:

A "Success" message appears in the popup.

No new contact is created.

The existing Google Contact's "Notes" field is updated.

The new AI Memory (with a timestamp) is appended to the bottom of the notes, preserving any old notes.

TC-03: Re-Update Contact (State B, repeated)

Objective: Verify that memories are stacked.

Precondition: A contact exists and already has one AI memory from TC-02.

Steps:

Go to the same LinkedIn profile from TC-02.

Click the Link3d extension icon.

Click the Add Memory to Contact button again.

Expected Result:

The Google Contact's "Notes" field now contains two AI-generated memories, each with a timestamp.

TC-04: Authorization Flow

Objective: Verify the Google auth flow works.

Precondition: User has not authorized the extension yet.

Steps:

Click the Link3d extension icon.

The popup should show an "Authorize Google" button.

Click the button.

Follow the Google auth prompts and approve.

Expected Result:

The popup refreshes and proceeds to TC-01 or TC-02. The user does not have to click the "Authorize" button again on subsequent uses.
