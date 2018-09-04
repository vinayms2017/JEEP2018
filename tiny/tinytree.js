// Created by Vinay.M.S as a part of demonstration for the JEEP framework.
// Usable subject to MIT license

JEEP.RegisterLibrary("TinyTree", function(){
	let env = this.namespace.GetEnvironment();	
	this.Build({
		"Layout": {builder: "Layout"}
	})
	let TinyCanvasLib = env.GetLibrary("TinyCanvas")
	let Line = TinyCanvasLib.GetObjectDef("Line")
	let Rectangle = TinyCanvasLib.GetObjectDef("Rectangle")
	let Text = TinyCanvasLib.GetObjectDef("Text")

	this.namespace.RegisterStructDef("Legend", {
		CONSTRUCTOR: function(msg, cmap){
			this.create(msg, cmap)
		},
		GetDOMElement: function(){ return this.div},
		Clear: function(){
			if(this.div){
				let title = this.div.firstChild;
				this.div.textContent = "";
				this.div.appendChild(title)
			}
		},
		Append: function(cmap){
			this.create(null, cmap)
		},
		div: null,
		create: function(msg, cmap){
			if(this.div === null){
				this.div = document.createElement("div")
				this.div.style.backgroundColor = "#f4f4f4"
				this.div.style.border = "1px solid gray"
				let title = document.createElement("div");
				title.textContent = msg;
				title.style.border = "1px solid gray"
				title.style.backgroundColor = "darkslategray"
				title.style.color = "white"
				title.style.padding = "5px"
				this.div.appendChild(title)
			}
			let iter = JEEP.Utils.ObjectIterator.New(cmap);
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				let row = document.createElement("div");
				row.style.margin = "5px 0";
				let color = document.createElement("span");
				color.textContent = "__"
				color.style.border = "1px solid black";
				color.style.backgroundColor = pair.value;
				color.style.color = color.style.backgroundColor;
				color.style.marginLeft = "5px";				
				let label = document.createElement("span");
				label.textContent = pair.key;
				label.style.marginLeft = "1em";
				row.appendChild(color);
				row.appendChild(label);
				this.div.appendChild(row);
			}
		},		
	})

	let Node = env.CreateRecordDef("Node", {
		name: "",	
		children: [], 
		x: -1,
		y: -1, 
		width: 0,
		nudgeCount: 0,// the number of '+' used to nudge a node downwards
		backgroundColor: "",
		textColor: "",
		args: "",
		ln: null,
		painted: false,// since nodes have one to many and many to one relationship, use this to avoid repeated paints
	})

	let LevInfo = env.CreateRecordDef("LevT", {nodes: [], y: -1})

	this.namespace.RegisterRecordDef("LayoutNode", {
		x: 0, y: 0, width: 0, height: 0,
		children: [],// LayoutNode
		nudgeCount: 0,
		cxa: 0, cya: 0, cxb: 0, cyb: 0,// connections
	})

	this.namespace.RegisterRecordDef("NodeColors", {
		backgroundColor: "white",
		textColor: "black",
	})
	
	let FONT =  "16px courier";
	let NODEHEIGHT = 25;
	let NODEWIDTH = 75;

	let NodeColors = this.namespace.GetObjectDef("NodeColors")
	let LayoutNode = this.namespace.GetObjectDef("LayoutNode")
	this.namespace.RegisterClassDef("Tree", {
		CONSTRUCTOR: function(width, height){
			this.mainPattern = /(\+*\$*\.?\w+[/\w\d\-]*)\s*\[([\w+\s*,\s*\+*\.?/+\-]+)\]/g;
			this.nodePattern = /\s*(\+*\.?\w+[\d/\w\-]*)\s*,?/g;
			this.boundWidth = width;
			this.boundHeight = height;
		},
		PUBLIC: {
			Paint: function(painter, LayoutManagerDef){
				painter.Reset();
				if(!LayoutManagerDef){					
					this.showError(painter, "TinyTree must be given a layout manager in order to paint");
					return;
				}
				let layoutManager = LayoutManagerDef.New();
				if(!layoutManager.SetupPositions){					
					this.showError(painter, "TinyTree must be given a layout manager with the function SetupPositions in order to paint");
					return;
				}
				let text = Text.InitNew({font: FONT})
				for(let k = 0; k<this.flatNodes.length; k++){
					let node = this.flatNodes[k];
					text.content = node.name;
					node.width = painter.GetTextWidth(text)*1.25;
					if(node.width < NODEWIDTH)
						node.width = NODEWIDTH;
					let ln = LayoutNode.InitNew({width: node.width, height: NODEHEIGHT, nudgeCount: node.nudgeCount});
					node.ln = ln;
				}
				for(let k = 0; k<this.flatNodes.length; k++){
					let node = this.flatNodes[k];
					for(let c = 0; c<node.children.length; c++){
						let cname = node.children[c];
						node.ln.children.push(this.nodes[cname].ln)
					}
				}
				let layoutNodes = [];
				for(let k = 0; k<this.root.children.length; k++){
					let node = this.nodes[this.root.children[k]]
					layoutNodes.push(node.ln)
				}
				layoutManager.SetupPositions(layoutNodes, this.boundWidth, this.boundHeight);
				for(let k = 0; k<this.flatNodes.length; k++){
					let node = this.flatNodes[k];
					node.x = node.ln.x;
					node.y = node.ln.y;
				}
				this.paint(painter)
			},
			Reset: function(script, painter, LayoutManagerDef){	
				let rootNode = Node.InitNew({name: "$"})
				let build = {}
				let main = null;
				while(main = this.mainPattern.exec(script)){
					let nameParts = main[1].split('/');
					let ret = this.createNode(build, nameParts);
					let node = ret.node;
					if(ret.root)
						rootNode.children.push(node.name);
					let n = null
					while(n = this.nodePattern.exec(main[2])){
						let nameParts = n[1].split('/');
						let cnr = this.createNode(build, nameParts)
						node.children.push(cnr.node.name)
					}					
				}
				build[rootNode.name] = rootNode;
				this.root = rootNode;
				this.nodes = build;
				let c = this.validateStructure();
				if(c !== undefined){
					this.showError(painter, c);
					return;
				}
				if(painter){					
					this.Paint(painter, LayoutManagerDef)
				}
			},
		},
		PROTECTED: {
			GetNodeColors__virtual: function(args){	
				return NodeColors.New();		
			}
		},
		PRIVATE: {
			root: null,
			nodes: {},
			dup: {},
			flatNodes: [],
			boundWidth: 0,
			boundHeight: 0,
			mainPattern: null,
			nodePattern: null,

			showError: function(painter, msg){
				painter.Reset();
				painter.DrawText(Text.InitNew({
					x: 50, y: 50,
					align: "left",
					content: msg,
					color: "Red",
					font: FONT,
				}))
			},
			createNode: function(build, nameParts){
				let ret = this.processName(nameParts[0])
				let node = build[ret.name]
				if(!node){
					node = Node.InitNew({name: ret.name, nudgeCount: ret.nudgeCount});
					build[ret.name] = node;
				}
				if(ret.nudgeCount)
					node.nudgeCount = ret.nudgeCount;
				if(nameParts.length > 1){
					let clr = nameParts[1];
					if(clr.length > 0)
						clr = "#"+clr;
					node.backgroundColor = clr;
				}
				if(nameParts.length > 2){
					let clr = nameParts[2];
					if(clr.length > 0)
						clr = "#"+clr;
					node.textColor = clr;
				}
				if(nameParts.length > 3)
					node.args = nameParts.slice(3).join('/');
				return {root: ret.root, node: node};
			},
			processName: function(n){
				let ret = {root: false, name: n, nudgeCount: 0};
				if(n[0] == '+'){
					let pos = 0;
					while(pos < n.length && n[pos] == '+')pos++;
					if(pos < n.length){
						ret.name = ret.name.substr(pos)
						ret.nudgeCount = pos;
					}
				}
				if(ret.name[0] == '$'){
					ret.root = true;
					ret.name = ret.name.substr(1);
				}
				if(ret.name[0] == '.'){
					ret.name = ret.name.substr(1);
					let c = this.dup[ret.name];
					c = c || 0;
					this.dup[ret.name] = ++c;
					ret.name = ret.name+"."+c+"."// a hack to accommodate duplicate names
				}
				// nodes are accessed by name from a map. and this name returns the JavaScript function 
				// which will cause errors, so fix the name;
				if(ret.name === "constructor")
					ret.name += "."
				ret.name = ret.name.split('-').join(' ')
				return ret;
			},
			validateStructure: function(){
				this.flatNodes = [];
				for(let k = 0; k<this.root.children.length; k++){
					let r = this.flatten(this.root.children[k], []);
					if(r !== undefined)
						return "STRUCTURE INVALID DUE TO THE CYCLE "+ r;
				}
				//console.log(this.getNodeNames(this.flatNodes))
			},
			flatten: function(name, rootArr){
				let node = this.nodes[name];
				if(rootArr.indexOf(node) >= 0){
					return this.getNodeNames(rootArr.concat([node]));
				}
				rootArr.push(node);
				this.flatNodes.push(node)
				for(let k = 0; k<node.children.length; k++){
					let r = this.flatten(node.children[k], rootArr);
					if(r !== undefined)
						return r;
				}
				rootArr.splice(rootArr.length-1, 1);
			},
			getNodeNames: function(narr){
				let s = "";
				for(let k = 0; k<narr.length; k++)
					s += "," + narr[k].name;
				return s.substring(1);
			},
			paint: function(painter){
				for(let k = 0; k<this.flatNodes.length; k++){
					let node = this.flatNodes[k];
					if(node.painted) continue;
					node.painted = true;
					let name = node.name;
					// remove dot suffix if any that will be added to accomodate duplicate names
					let dot = name.indexOf('.');
					if(dot >= 0)
						name = name.substring(0, dot);
					let nci = node.args ? this.GetNodeColors(node.args) : null;
					painter.DrawRectangle(Rectangle.InitNew({
						x: node.x, y: node.y,
						width: node.width, height: NODEHEIGHT,
						fillColor: nci ? nci.backgroundColor||node.backgroundColor : node.backgroundColor,
					}))
					painter.DrawText(Text.InitNew({
						x: node.x+node.width/2, 
						y: node.y+NODEHEIGHT/2+5, // hacked value to center for the given font
						content: name, 
						color: nci ? nci.textColor||node.textColor : node.textColor, 
						font: FONT,
					}))
					if(node.children){
						for(let k = 0; k<node.children.length; k++){
							let cn = this.nodes[node.children[k]]
							painter.DrawLine(Line.InitNew({
								xa: node.ln.cxa, ya: node.ln.cya,
								xb: cn.ln.cxb, yb: cn.ln.cyb,
								color: "gray"
							}))
						}
					}
				}
			},
		}
	})
})