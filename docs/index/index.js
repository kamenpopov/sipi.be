let theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);

const sun = document.getElementById('sun');
const earth = document.getElementById('earth');
const flyingShit = document.getElementById('flying_shit');

function changeDecoration() {
	if(theme == 'dark') {
		flyingShit.src = 'index/img/saturn.gif';
	} else {
		flyingShit.src = 'index/img/bird-gif.gif';
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

earth.addEventListener('click', switchTheme);

