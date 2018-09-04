JEEP.RegisterLibraryBuilder("Layout", "TinyTree", function(){
	this.namespace.RegisterRecordDef("LevRec", {
		nodes: [],
		width: 0,
		height: 0,
		maxwidth: 0,
		maxheight: 0,
	})
	let LevRec = this.namespace.GetObjectDef("LevRec");
	
	this.namespace.RegisterClassDef("LayoutBase", {
		PUBLIC: {
			SetupPositions__abstract: function(nodeArr, width, height){},
		},
		PROTECTED: {
			xgap: 0,
			ygap: 0,
			getLevelInfo: function(node, levInfo, ln){
				let lrec = ln >= levInfo.length ? LevRec.New() : levInfo[ln];
				if(ln >= levInfo.length)
					levInfo.push(lrec);
				if(lrec.nodes.indexOf(node) < 0)
					lrec.nodes.push(node);		
				for(let k = 0; k<node.children.length; k++)
					this.getLevelInfo(node.children[k], levInfo, ln+1)
			}
		},
	})
	let LayoutBase = this.namespace.GetObjectDef("LayoutBase")
	this.namespace.RegisterClassDef("VertLayout", {
		EXTENDS: [LayoutBase],
		CONSTRUCTOR: function(){		
			this.xgap = 10;
			this.ygap = 20;
		},
		PUBLIC: {
			SetupPositions__virtual: function(nodeArr, width, height){
				let levInfo = [];
				for(let k = 0; k<nodeArr.length; k++){
					let node = nodeArr[k];
					if(node.children.length > 0)
						this.getLevelInfo(node, levInfo, 0)
				}

				for(let k = 0; k<levInfo.length; k++){
					let lrec = levInfo[k];
					for(let j = 0; j<lrec.nodes.length; j++){
						let node = lrec.nodes[j];
						lrec.width += (node.width + this.xgap);
					}
				}

				let y = 10;
				for(let k = 0; k<levInfo.length; k++){
					let lrec = levInfo[k];
					let x = (width - lrec.width)/2
					let yy = y;
					for(let j = 0; j<lrec.nodes.length; j++){
						let node = lrec.nodes[j];
						node.x = x
						x = node.x + (node.width + this.xgap);;
						node.y = y + (node.nudgeCount*node.height)
						node.cxa = node.x + node.width/2;
						node.cya = node.y + node.height;
						node.cxb = node.cxa;
						node.cyb = node.y;
						if(yy < node.y + node.height)
							yy = node.y + node.height;
					}
					y = yy + this.ygap;
				}
			},
		}
	})
	this.namespace.RegisterClassDef("HorzLayout", {
		EXTENDS: [LayoutBase],
		CONSTRUCTOR: function(){		
			this.xgap = 20;
			this.ygap = 10;
		},
		PUBLIC: {
			SetupPositions__virtual: function(nodeArr, width, height){
				let levInfo = [];
				for(let k = 0; k<nodeArr.length; k++){
					let node = nodeArr[k];
					if(node.children.length > 0)
						this.getLevelInfo(node, levInfo, 0)
				}

				for(let k = 0; k<levInfo.length; k++){
					let lrec = levInfo[k];
					for(let j = 0; j<lrec.nodes.length; j++){
						let node = lrec.nodes[j];
						lrec.height += (node.height + this.ygap);
						if(lrec.maxwidth < node.width)
							lrec.maxwidth = node.width
					}
				}

				let x = 10;
				for(let k = 0; k<levInfo.length; k++){
					let lrec = levInfo[k];
					let y = (height - lrec.height)/2
					let xx = x;
					for(let j = 0; j<lrec.nodes.length; j++){
						let node = lrec.nodes[j];
						node.y = y;
						y = node.y + (node.height + this.ygap);
						node.x = x + (node.nudgeCount*node.width)
						node.cxa = node.x + node.width;
						node.cya = node.y + node.height/2;
						node.cxb = node.x;
						node.cyb = node.cya;
						if(xx < node.x + lrec.maxwidth)
							xx = node.x + lrec.maxwidth;
					}
					x = xx + this.xgap;
				}
			},
		}
	})	
})