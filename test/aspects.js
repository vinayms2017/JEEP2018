// Written by Yinay.M.S
// usable subject to MIT license

function CreateAspectsUI(div){
	let aspMap = {}, aspCounter = {};
	let listElem = null;
	let currPos = -1;
	let currArr = null;
	let currId = null;
	let aspKeys = null;
	let nextNavig = null, currNavig = null, prevNavig = null;
	let SELECTED_COLOR = "darkslategray";
	let SELECTED_TEXTCOLOR = "white";
	let NORMAL_COLOR = "white";
	let NORMAL_TEXTCOLOR = "black";
	let BUTTON_COLOR = "gray";

	for(let k = 0; k<div.children.length; k++){
		let d = div.children[k];
		let asp = d.getAttribute("data-aspects")
		if(asp === undefined)
			continue;
		if(d.id === undefined)
			d.id = "aspects-div-id-" + k;
		addAspects(asp, d.id)
	}
	return createUI();

	function createUI(){
		aspKeys = Object.keys(aspCounter);
		if(aspKeys.length == 0)
			return null;

		let div = createDiv({add: true})
		div.id = "aspects-browser";
		div.style.width = "20%";
		div.style.position = "fixed";
		div.style.bottom = "0";
		div.style.right = "0";
		div.style.border = "1px solid gray";
		div.style.margin = "5px";
		div.style.fontSize = "15px";
		div.style["font-family"] = "initial";

		let title = document.createElement('span')
		title.textContent = "Aspects Navigator";
		title.style.display = "block";
		title.style.padding = "3px";
		title.style.textAlign = "center";
		title.style.backgroundColor = "lightgray";
		div.appendChild(title);

		let listdiv = document.createElement("div");
		listdiv.style.height = "15em";// about 15 lines
		listdiv.style.overflowY = "auto";
		div.appendChild(listdiv);
		listElem = document.createElement("ol")
		listElem.style.margin = "0";
		listElem.style["margin-right"] = "1em";
		listdiv.appendChild(listElem);		

		let navig = document.createElement("div");
		navig.style.padding = "5px 0";
		navig.style.textAlign = "center";
		navig.style.marginTop = "5px";
		navig.style.border = "1px solid lightgray";
		currNavig = document.createElement("span");
		currNavig.style.padding = "0 5px";
		currNavig.style.minWidth = "5em";
		currNavig.style.fontSize = "12px";
		nextNavig = document.createElement("button");
		nextNavig = createButton("Next", "Navigates to next test that includes the selected aspect")
		prevNavig = createButton("Prev", "Navigates to previous test that includes the selected aspect");
		let sort = createButton("Sort by count", "Toggles between sorting aphabetically and in descending order of number of occurances");
		sort.asporder = "alpha";
		sort.onclick = onsortclick;
		navig.appendChild(sort);
		navig.appendChild(currNavig);
		navig.appendChild(prevNavig);
		navig.appendChild(nextNavig);
		div.appendChild(navig);

		// pre create li elements, the number remains the same only order varies
		for(let k = 0; k<aspKeys.length; k++){
			let li = document.createElement("li");
			li.style.cursor = "pointer";
			li.style.padding = "0 5px";
			li.style.position = "relative";
			li.onclick = onliclick;
			let check = document.createElement("input")
			check.type = "checkbox"
			check.style.width = "10px"
			check.style.height = "10px"
			check.style.verticalAlign = "middle";
			check.onclick = oncheckclick;
			li.appendChild(check);
			li.appendChild(document.createElement("span"))
			listElem.appendChild(li);
		}
		fillList(true);
		enableButton(false, nextNavig);
		enableButton(false, prevNavig);
		return div;
	}

	function onsortclick(e){
	    this.asporder = (this.asporder == "alpha") ? "count" : "alpha";
	    this.textContent = (this.asporder == "alpha") ? "Sort by count" : "Sort by name";
 	    fillList(this.asporder=="alpha");
	}
	function onliclick(e){
		if(this.$checked){
			this.$checked = false;
			return;
		}
		resetSelections();
		selectItem(this, true);
		selectAspDiv(false);
		currArr = getAspComboIdList(this.$aspname);
		updateUI();
	}
	function oncheckclick(e){
		this.parentElement.$checked = true;
		selectItem(this.parentElement, this.checked);
		let aspects = getSelectedItemLabels().join(',');
		selectAspDiv(false);
		currArr = getAspComboIdList(aspects);
		updateUI();
	}
	function onnextclick(e){
		if(currPos < currArr.length-1){
			enableButton(true, prevNavig, onprevclick);
			selectAspDiv(false);
			currPos++;
			selectAspDiv(true);
		}
		enableButton(currPos < currArr.length-1, nextNavig, onnextclick);
	}
	function onprevclick(e){
		if(currPos > 0){
			enableButton(true, nextNavig, onnextclick);
			selectAspDiv(false);
			currPos--;
			selectAspDiv(true);
		}
		enableButton(currPos > 0, prevNavig, onprevclick);
	}

	function updateUI(){
		currPos = 0;
		selectAspDiv(true);
		enableButton(false, prevNavig);
		enableButton(currArr.length > 1, nextNavig, onnextclick);
	}
	function fillList(byalpha){
	   	if(byalpha)
			aspKeys.sort();
		else
			aspKeys.sort(function(a,b){return aspCounter[b] - aspCounter[a]})
		let oldsel = getSelectedItemLabels();
		for(let k = 0; k<aspKeys.length; k++){
			let ky = aspKeys[k];
			let li = listElem.children[k];
			selectItem(li, false);
			let aspcount = aspCounter[ky];
			li.lastChild.textContent = ky + " (" + aspcount + ")";
			li.$aspname = ky;
		}
		selectItemByLabel(oldsel);
	}

	function selectItem(li, select){
		li.style.backgroundColor = select ? SELECTED_COLOR : NORMAL_COLOR;
		li.lastChild.style.color = select ? SELECTED_TEXTCOLOR : NORMAL_TEXTCOLOR;
		li.$selected = select;
		li.firstChild.checked = select;
	}
	function selectItemByLabel(labels){
		for(let k = 0; k<listElem.children.length; k++){
			let li = listElem.children[k];
			if(labels.indexOf(li.$aspname) >= 0)
				selectItem(li, true);
		}
	}
	function getSelectedItemLabels(){
		let names = [];
		for(let k = 0; k<listElem.children.length; k++){
			let li = listElem.children[k];
			if(li.$selected === true)
				names.push(li.$aspname)
		}
		return names;
	}
	function resetSelections(){
		for(let k = 0; k<listElem.children.length; k++){
			let li = listElem.children[k];
			li.firstChild.checked = false;
			selectItem(li, false);
		}
	}

	function selectAspDiv(select){
		if(currArr == null)
			return;
		let id = null;
		if(currArr.length > 0) {
			id = currArr[currPos];
			document.location.href = "#"+id
			if(select)
				currId = id;
		}
		else {
			select = false;
			id = currId;
			currId = null;
		}
		if(id !== null){
			let div = document.getElementById(id);
			div.style.backgroundColor = select ? SELECTED_COLOR : NORMAL_COLOR;
			div.style.color = select ? SELECTED_TEXTCOLOR : NORMAL_TEXTCOLOR;
		}
		currNavig.textContent = select ? (currPos+1)+"/"+currArr.length : "";
	}
	function enableButton(enable, btn, func){
		btn.onclick = enable ? func : null;
		btn.disabled = !enable;
	}
	function addAspects(aspects, testId){
		aspects = inSortString(aspects);
		let combo = aspMap[aspects]
		if(combo === undefined){
			combo = [];
			aspMap[aspects] = combo;
		}
		combo.push(testId);

		let asparr = splitTrim(aspects)
		for(let k = 0; k<asparr.length; k++){
			let asp = asparr[k];
			if(asp == "constructor")
				asp += " "
			let count = aspCounter[asp] || 0;
			count++;
			aspCounter[asp] = count;
		}
		return asparr;
	}
	function getAspComboIdList(asp){
		asp = inSortString(asp);
		let list = [];
		if(asp.length > 0){
			let keys = Object.keys(aspMap)
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				if(ky.indexOf(asp) >= 0)
					list = list.concat(aspMap[ky])
			}
		}
		return list;
	}

	function splitTrim(str){
		return str.split(",").map(function(item){return item.trim()})
	}

	function inSortString(str){
		return splitTrim(str).sort().join(',')
	}

	// info = {add, style, text}
	function createDiv(info){
		let style = info && info.style;
		let div = document.createElement("div");
		div.style.whiteSpace = "pre-wrap";
		//div.style.lineHeight = "1";
		div.style.margin = "1em";
		div.style.fontFamily = style && style.fontFamily ? style.fontFamily : "courier";
		div.style.fontSize = style && style.fontSize ? style.fontSize : "16px";
		div.style.fontStyle = style && style.fontStyle ? style.fontStyle : "normal";
		if(info && info.text)
			div.textContent = info.text;
		if(info && info.add)
			document.body.appendChild(div);
		return div;
	}

	function createButton(label, title){
		let btn = document.createElement("button")
		btn.style.padding = "0 2px";
		btn.style.margin = "0 2px";
		btn.textContent = label;
		btn.title = title;		
		return btn;
	}
}