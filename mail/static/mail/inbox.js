document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);

	// To display active tabs
	for (const btn of document.querySelectorAll(".tab-btn")) {
		btn.addEventListener("click", () => {
			for (const tabBtn of document.querySelectorAll(".tab-btn")) {
				tabBtn.classList.remove("active")
			};
			btn.classList.add("active")
		})
	}

	// By default, load the inbox
	load_mailbox('inbox');
});

function compose_email() {

	// Show compose view and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox) {
	
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';

	// Show the mailbox name
	document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;




	let object = await fetch(`/emails/${mailbox}`)
	let response = await object.json()
	
	var html = "<div>"
	for (const obj of response) {
		var bg;
		if (!obj.read) bg = ""
		else bg = 'style="background: lightgray"'

		html += `<div class="email-container clearfix border border-dark p-3" ${bg} data-email-id="${obj.id}" data-view="${mailbox}">
					<span class="float-start me-3"><strong>${obj.sender}</strong></span>
					<span class="float-start">${obj.subject}</span>
					<span class="float-end">${obj.timestamp}</span>
				</div>`
	}
	html += "</div>"
	document.getElementById("emails-view").insertAdjacentHTML("beforeend", html)

	for (const div of document.querySelectorAll(".email-container")) {
		div.addEventListener("click", () => {loadEmail(div.dataset.emailId, div.dataset.view)})
	}
}


async function sendEmail() {
	// Changing apperance of btn
	var btn = document.getElementById("submit-email-btn")
	let span = document.createElement("span")
	span.classList.add("spinner-border", "spinner-border-sm")
	btn.appendChild(span)
	btn.innerHTML = "Sending.."

	// Sending the email
	var recipients = document.querySelector("#compose-recipients").value;
	var subject = document.querySelector("#compose-subject").value;
	var body = document.querySelector("#compose-body").value;
	var div;

	const data = {
		recipients: recipients,
		subject: subject,
		body: body
	}

	try {
		let object = await fetch("/emails", {
			method: "POST",
			body: JSON.stringify(data)
		})
		
		let response = await object.json()
		
		if (response.error) {
			throw response.error
		} else {
			div = '<div class="alert alert-success alert-dismissible fade show">' +
            '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
            '<strong>Email sent successfully!</strong></div>'

			document.getElementById("sent").click()
		}
	} catch (err) {
		div = '<div class="alert alert-danger alert-dismissible fade show">' +
            '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
            `<strong>${err}!</strong></div>`
	}	
	document.getElementById("emails-view").insertAdjacentHTML("beforebegin", div)
	document.querySelector("h2").scrollIntoView()
	
	// Changing button back to normal
	span.remove()
	btn.innerHTML = "Send"

	return false;
	
}

async function loadEmail(id, view) {
	let object = await fetch("/emails/" + id)
	let response = await object.json()

	// Archive button
	var archiveBtn = "";
	if (view === "inbox") archiveBtn = `<button class="btn btn-outline-primary arch-btn">Archive</button>`
	else if (view === "archive") archiveBtn = `<button class="btn btn-primary arch-btn">Unarchive</button>`
	


	let html = `<div class="container">
					<p><strong>From:</strong> ${response.sender}</p>
					<p><strong>To:</strong> ${response.recipients}</p>
					<p><strong>Subject:</strong> ${response.subject}</p>
					<p><strong>Timestamp:</strong> ${response.timestamp}<br></p>
					${archiveBtn}
					<button class="btn btn-outline-primary" id="reply-btn">Reply</button><br>
					<hr>
					<pre>${response.body}</pre>
			 	</div>` 
				
	// Update the email by sending a PUT request to change it to read true
	object = await fetch("/emails/" + id, {
		method: "PUT",
		body: JSON.stringify({
			read: true
		})
	})

	document.querySelector("#emails-view").innerHTML = html

	// Handling put request for archive button
	for (const btn of document.querySelectorAll(".arch-btn")) {
		btn.addEventListener("click", async function () {
			object = await fetch("/emails/" + id, {
				method: "PUT",
				body: JSON.stringify({
					archived: (btn.innerHTML === "Archive") ? true:false
				})
			});
			
			document.querySelector("#inbox").click()
			let div = `<div class="alert alert-success alert-dismissible fade show">
        					<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            				<strong>Email ${btn.innerHTML.toLowerCase()}d!</strong>
						</div>`	

			document.querySelector("#emails-view").insertAdjacentHTML("afterbegin", div)
		})
	}
	
	// Reply button
	document.getElementById("reply-btn").addEventListener("click", () => {
		document.querySelector("#compose").click()
		document.querySelector("#compose-recipients").value = response.sender
		document.querySelector("#compose-subject").value = (!response.subject.startsWith("Re: ")) ? "Re: " + response.subject: response.subject
		document.querySelector("#compose-body").value = `On ${response.timestamp} ${response.sender} wrote:\n${response.body}\n\n`
	})
}
