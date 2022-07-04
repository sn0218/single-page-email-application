document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // listen for the submission of compose form
  document.querySelector('#compose-form').onsubmit = send_email;
});


function send_email() {
  // find the data the user just submitted
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // send a POST request to server
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  // put post response into json form
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    // after sending the emails, load the sent mailbox
    load_mailbox('sent');
    
  })
  // Catch any errors and log them to the console
  .catch(error => {
    console.log('Error:', error);
  });
  

  // stop form from submitting to stay in the sent mailbox view
  return false;
}


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector("#single-email-view").style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-title').innerHTML = 'New Email';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#single-email-view").style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `
  <h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>

  <div class="email-row" id="email-title-row">
    <span class="inner">From</span>
    <span class="inner">Subject</span>
    <span class="inner">Time</span>
  </div>
  `;


  // send a GET request to server to request the emails for a particular mailbox
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // display each email object in div
      emails.forEach(email => {
        // create div element to display each email
        const emailDisplay = document.createElement('div');
        
        // add the class 
        emailDisplay.classList.add("email-row", email.read? "read": "unread");
        
        // add the content in created div
        emailDisplay.innerHTML = `
          <span class="inner"> <b>${email.sender}</b> </span>
          <span class="inner" id="subject"> ${email.subject} </span>
          <span class="inner" id="timestamp"> ${email.timestamp} </span>
        `;
        
        // listen for the click of each email-row
        emailDisplay.addEventListener('click', () => load_email(email.id, mailbox));
   
        // add email-row div to the DOM in emails-view
        document.querySelector('#emails-view').append(emailDisplay);

      });
      
  })
  // Catch any errors and log them to the console
  .catch(error => {
    console.log('Error:', error);
  });
}


function load_email(email_id, mailbox) {
  // Show the email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';

  // clear out the single-email view
  document.querySelector('#single-email-view').innerHTML = "";


  // send a GET request to the server to get an email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);   

      /* single-email-content */
      // create div element to display email content
      const emailContent = document.createElement('div');
      emailContent.setAttribute('id', 'email-content');

      // create p element to store the recipients
      const recipientDisplay = document.createElement('p');
      recipientDisplay.innerHTML = `<b>To: </b>`;

      // add each recipient in the created p element
      email.recipients.forEach(recipient => {
        recipientDisplay.innerHTML += recipient + '; ';
      });
      
      // add the content in created div
      emailContent.innerHTML = `
        <h4><b>${email.subject}</b></h4>
        <p><b>From: </b>${email.sender};</p>`;

      emailContent.appendChild(recipientDisplay);

      emailContent.innerHTML += `
        <p><b>Timestamp: </b>${email.timestamp}</p>
        <p><b>Subject: </b>${email.subject}</p>
        <hr>
        <p>${email.body}</p>`;

      // add newly created div to the DOM in single-email-view
      document.querySelector('#single-email-view').append(emailContent);


      /* archive button and reply button */
      const archiveButton = document.createElement('input');
      archiveButton.type = 'button';
      archiveButton.id = 'archive-button';
      if (email.archived === false){
        archiveButton.value = 'Archive';
      } else {
        archiveButton.value = 'Unarchive';
      }
      archiveButton.className = 'btn btn-primary';

      const replyButton = document.createElement('input');
      replyButton.type = 'button';
      replyButton.id = 'reply-button';
      replyButton.value = 'Reply'; 
      replyButton.className = 'btn btn-primary' ;

      // add two buttons to the DOM in single-email-view except in sent mailbox
      if (mailbox !== 'sent') {
        document.querySelector('#single-email-view').append(replyButton);
        document.querySelector('#single-email-view').append(archiveButton);
      }
     
      // listen for the click of archive button
      archiveButton.addEventListener('click', () => archive_email(email, email.id));

      // listen for the click of reply button
      replyButton.addEventListener('click', ()=> reply_email(email));

  })
  .catch(error =>
    console.log(error));

  // send a PUT request to the server to mark an email is already read
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}  


function archive_email(email, email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        /* toggle the archived field by checking if the mail is archived.
          if the email is archived, return false to unarchive, and vice versa*/
        archived: email['archived']? false : true
    })
  })
  .then (response => 
    // after archiving the email, load the inbox mailbox
    load_mailbox('inbox'))
}


function reply_email(email) {
  compose_email();

  // populate the composition field
  document.querySelector('#compose-title').innerHTML = `New email: reply to ${email.subject}`;
  document.querySelector('#compose-recipients').value = email.sender;

  // pre-fill subject line
  let subject = email.subject;
  if (subject.split(' ')[0] !== 'Re:') {
    subject = 'Re: ' + subject;
  }
  document.querySelector('#compose-subject').value = subject;

  // pre-fill body
  const body = 'On ' + email.timestamp + ' ' + email.sender + ' wrote:';
  document.querySelector('#compose-body').value = body;

}