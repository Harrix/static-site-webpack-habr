const API_URL = 'http://localhost:3000'
const USER_URL = `${API_URL}/user`;

async function getUserData(url = '', data = {}, method = 'GET') {
	const fetchOptions = {
		method: method, // *GET, POST, PUT, DELETE, etc.
		mode: 'cors', // no-cors, *cors, same-origin
		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
		credentials: 'same-origin', // include, *same-origin, omit
		
		headers: {
			'Content-Type': 'application/json',
			"Access-Control-Allow-Origin" : "*",
			"Access-Control-Allow-Credentials" : true
			// 'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: JSON.stringify(data),
		redirect: 'follow', // manual, *follow, error
		referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
	};
	
	const response = await fetch(url, method === 'GET' ? {} : fetchOptions);
	return response.json();
}

function getFullName(data) {
	if (!data) return 'No name.';
	return `${data?.firstName} ${data?.lastName}`
}

function appendUserData(data) {
	if (data) {
		const node = document.createElement("div");                 // Create a <li> node
		const textnode = document.createTextNode(getFullName(data));         // Create a text node
		
		node.style.background = 'yellow';
		
		node.appendChild(textnode);
		
		document.getElementById("fullName").appendChild(node);
	}
}

async function sendUserInfo() {
	// const value = userInput.value;
	const value = document.getElementById('userInput').value;
	await getUserData(USER_URL, {
		firstName: value
	}, 'POST');
}

sendBtn.addEventListener('click', sendUserInfo);

document.addEventListener("DOMContentLoaded", async function() {
	const userData = await getUserData(USER_URL, {}, 'GET');
	if (userData) {
		appendUserData(userData);
	}

});
