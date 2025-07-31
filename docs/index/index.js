let theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);

const sun = document.getElementById('sun');
const moon = document.getElementById('moon');
const flyingShit = document.getElementById('flying_shit');


function changeDecoration() {
	if(theme == 'dark') {
		flyingShit.src = 'index/saturn.gif';
	} else {
		flyingShit.src = 'index/bird-gif.gif';
	}
}
changeDecoration();

function switchTheme() {
	theme = theme == 'light' ? 'dark' : 'light';
	localStorage.setItem('theme', theme);
	document.documentElement.setAttribute('data-theme', theme);
	changeDecoration();
}

sun.addEventListener('click', switchTheme);

moon.addEventListener('click', switchTheme);

