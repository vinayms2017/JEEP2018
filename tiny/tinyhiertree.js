// Created by Vinay.M.S as a part of demonstration for the JEEP framework.
// Usable subject to MIT license

JEEP.RegisterLibrary("TinyHierTree", function(){
	let env = this.namespace.GetEnvironment();	
	let PainterLib = env.GetLibrary("TinyPainter")
	let Line = PainterLib.GetObjectDef("Line")
	let Rectangle = PainterLib.GetObjectDef("Rectangle")
	let Text = PainterLib.GetObjectDef("Text")

	let Node = env.CreateRecordDef("Node", {
		name: "",	
		children: [], 
		x: -1,
		y: -1, 
		w: 75,
		lowCount: 0,// the number of '=' used to nudge a node downwards
		backgroundColor: "",
		textColor: "",
		args: "",
		painted: false,// since nodes have one to many and many to one relationship, use this to avoid repeated paints
	})

	let LevInfo = env.CreateRecordDef("LevT", {nodes: [], y: -1})

	this.namespace.RegisterRecordDef("NodeColors", {
		backgroundColor: "white",
		textColor: "black",
	})
	
	let FONT =  "14px consolas";
	let NODEHEIGHT = 25;

	let NodeColors = this.namespace.GetObjectDef("NodeColors")
	this.namespace.RegisterClassDef("Tree", {
		CONSTRUCTOR: function(bw, script){
			this.mainPattern = /(\+*\$*\.?\w+[/\w\d]*)\s*\[([\w+\s*,\s*\+*\.?/+]+)\]/g;
			this.nodePattern = /\s*(\+*\.?\w+[\d/\w]*)\s*,?/g;
			this.boundWidth = bw;
			this.Reset(script)
		},
		PUBLIC: {
			Paint: function(painter){
				this.init(painter);
				this.paint(this.root.children, painter)
			},
			Reset: function(script, painter){	
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
				if(painter){
					painter.Reset();
					this.Paint(painter)
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
			rowGap: 15,
			width: 0,
			boundWidth: 0,
			mainPattern: null,
			nodePattern: null,

			createNode: function(build, nameParts){
				let ret = this.processName(nameParts[0])
				let node = build[ret.name]
				if(!node){
					node = Node.InitNew({name: ret.name, lowCount: ret.lowCount});
					build[ret.name] = node;
				}
				if(ret.lowCount)
					node.lowCount = ret.lowCount;
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
				let ret = {root: false, name: n, lowCount: 0};
				if(n[0] == '+'){
					let pos = 0;
					while(pos < n.length && n[pos] == '+')pos++;
					if(pos < n.length){
						ret.name = ret.name.substr(pos)
						ret.lowCount = pos;
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
				return ret;
			},
			init: function(painter){
				let levinfo = {}
				this.getLevelWidth(this.root.children, 1, levinfo)

				let keys = Object.keys(levinfo)
				let tw = 0
				let y = NODEHEIGHT;
				let lowy = 0;
				for(let k = 0; k<keys.length; k++){
					let li = levinfo[keys[k]]

					let w = li.nodes.length
					if(w > tw)
						tw = w;
					
					li.y = y + (k>0 ?this.rowGap + NODEHEIGHT:0)
					for(let j = 0; j<li.nodes.length; j++){
						let node = this.nodes[li.nodes[j]]
						if(node.lowCount)
							node.y = li.y + (node.lowCount)*NODEHEIGHT;
						else
							node.y = li.y
						if(lowy < node.y)
							lowy = node.y
					}
					y = lowy + this.rowGap;
				}
				this.width = tw;				
				this.setXPos(painter, this.root.children, 1, levinfo, {})
			},
			getLevelWidth: function(nodeNames, lev, levinfo){
				let li = levinfo[lev];
				if(!li){
					li = LevInfo.New()
					levinfo[lev] = li;
				}
				for(let k = 0; k<nodeNames.length; k++){
					let n = nodeNames[k]
					if(li.nodes.indexOf(n) < 0)
						li.nodes.push(n)
				}
				for(let k = 0; k<nodeNames.length; k++){
					let node = this.nodes[nodeNames[k]]
					this.getLevelWidth(node.children, lev+1, levinfo)
				}
			},
			setXPos: function(painter, nodeNames, lev, levinfo, levx){
				let li = levinfo[lev];
				let nc = li.nodes.length
				let x = levx[lev] || 0
				let w = this.boundWidth/(nc+1)
				let tprop = Text.InitNew({font: FONT});
				for(let k = 0; k<nodeNames.length; k++){
					let node = this.nodes[nodeNames[k]]
					tprop.content = node.name;
					// let nw = painter.GetTextWidth(tprop) * 1.5;
					// if(node.nw < nw)
					// 	node.w = nw
					if(node.x < 0)
						node.x = (x+k+1)*w-node.w/2
					if(node.children)
						this.setXPos(painter, node.children, lev+1, levinfo, levx)
				}
				if(nodeNames.length > 0)
					levx[lev] = (levx[lev] || 0) + nodeNames.length
			},
			paint: function(nodeNames, painter){
				for(let k = 0; k<nodeNames.length; k++){
					let node = this.nodes[nodeNames[k]]
					if(node.painted) continue;
					node.painted = true;
					let name = node.name;
					// remove dot suffix if any that will be added to accomodate duplicate names
					let dot = name.indexOf('.');
					if(dot >= 0)
						name = name.substring(0, dot);
					let nci = node.args ? this.GetNodeColors(node.args) : null;
					painter.AddRectangle(Rectangle.InitNew({
						x: node.x, y: node.y,
						width: node.w, height: NODEHEIGHT,
						fillColor: nci ? nci.backgroundColor||node.backgroundColor : node.backgroundColor,
					}))
					painter.AddText(Text.InitNew({
						x: node.x+node.w/2, 
						y: node.y+NODEHEIGHT/2+5, // hacked value to center for the given font
						content: name, 
						color: nci ? nci.textColor||node.textColor : node.textColor, 
						font: FONT,
						boundHeight: NODEHEIGHT
					}))
					if(node.children){
						this.paint(node.children, painter)
						for(let k = 0; k<node.children.length; k++){
							let cn = this.nodes[node.children[k]]
							painter.AddLine(Line.InitNew({
								xa: node.x+node.w/2, ya: node.y+NODEHEIGHT, 
								xb: cn.x+node.w/2, yb: cn.y, color: "gray"
							}))
						}
					}
				}
			},
		}
	})
})