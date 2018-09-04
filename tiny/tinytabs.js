// Created by Vinay.M.S as a part of demonstration for the JEEP framework.
// Usable subject to MIT license

JEEP.RegisterLibrary("TinyTab", function(){
	this.namespace.RegisterRecordDef("Panel", {
		title: "",
		domElement: null,
	})

	JEEP.Typedef("TabPanel", this.namespace.GetObjectDef("Panel").$name)

	this.namespace.RegisterClassDef("Tab", {
		CONSTRUCTOR: function(){
			this.domElement = document.createElement("div")
			this.title = document.createElement("div")
			this.panel = document.createElement("div")
			this.domElement.appendChild(this.title);
			this.domElement.appendChild(this.panel);

			this.title.style.backgroundColor = "gray"
			this.title.style.display = "inline-flex"
			this.title.style.borderRadius = "5px"
			this.title.style.width = "100%"

			this.panel.style.display = "block"
			this.panel.style.overflow = "auto"
			this.panel.style.border = "1px solid gray"
			this.panel.style.padding = "0.5em"

			this.onclick = this.clickHandler.bind(this);
		},
		PUBLIC: {
			AddPanel__argtype: function(panel__TabPanel){
				return function(panel){
					this.panel.appendChild(panel.domElement);
					let tab = this.createTab(panel.title);
					tab.panel = panel.domElement;
					panel.domElement.style.display = "none"
					this.tabArray.push(tab)
					this.activatePanel(this.tabArray.length-1, false)
				}
			},
			ActivatePanel: function(pos){
				if(this.currTab)
					this.updateCurrTab(false)
				if(pos >= 0 && pos < this.tabArray.length){
					this.currTab = this.tabArray[pos];
					this.updateCurrTab(true)
				}
			},
			SetSize: function(width, height){
				this.panel.style.height = height;
			},
			UpdateAllTabs: function(){
				for(let k = 0; k<this.tabArray.length; k++)
					this.UpdateTab(this.tabArray[k])
			},
		},
		PROTECTED: {
			UpdateTab__virtual: function(tab){},
		},
		PRIVATE: {
			domElement__get: null,
			title: null,
			panel: null,
			tabArray: [],
			currTab: null,
			onclick: null,

			createTab: function(title){
				let tab = document.createElement("span")
				this.title.appendChild(tab);
				tab.textContent = title;
				tab.style.backgroundColor = "lightgray";
				tab.style.padding = "5px";
				tab.style.border = "1px solid gray"
				tab.style.borderRadius = "5px"
				tab.style.font = "12px Verdana"
				tab.style.cursor = "pointer"
				tab.onclick = this.onclick;
				return tab;
			},
			updateCurrTab: function(active){
				this.currTab.style.backgroundColor = active ? "lightyellow" : "lightgray"
				this.currTab.style.color = active ? "black" : "black"
				this.currTab.panel.style.display = active ? "block" : "none"
			},
			clickHandler: function(e){
				let i = this.tabArray.indexOf(e.target)
				this.activatePanel(i, true)
			},
			activatePanel: function(i, updateAll){
				this.ActivatePanel(i)
				if(updateAll)
					this.UpdateAllTabs()
			}
		},
	})
})