// Created by Vinay.M.S as a part of demonstration for the JEEP framework.
// Usable subject to MIT license

JEEP.RegisterLibrary("TinyCanvas", function(){
	this.namespace.RegisterStructDef("Point", {
		x: 0, 
		y: 0,
		GetDistanceFrom: function(other){
			if(!this.$def.InstanceOf(other))
				return null;
			return {width: Math.abs(this.x - other.x), height: Math.abs(this.y-other.y)}
		}
	})

	this.namespace.RegisterRecordDef("TextProperty", {
		font: "14pt Verdana",
		color: "black",
		align: "center",
		boundHeight: 0,
	})
	
	let TextProp = this.namespace.GetObjectDef("TextProperty");

	this.namespace.RegisterClassDef("CanvasXY", {
		CONSTRUCTOR: function(canvas){
			this.canvasElement = canvas || document.createElement("canvas");
			this.canvasElement.style.border = "1px solid gray"
			this.ctx = this.canvasElement.getContext('2d');
		},
		PUBLIC: {
			canvasElement__get: null,

			Clear: function(){
				this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
			},
			DrawLine: function(start, end, color){
				if(color) this.saveProps()
				if(color) this.ctx.strokeStyle = color;
				this.ctx.beginPath();
				this.ctx.moveTo(start.x, start.y)
				this.ctx.lineTo(end.x, end.y)
				this.ctx.stroke();
				this.ctx.closePath();
				if(color) this.restoreProps()
			},
			DrawBox: function(topleft, rightbottom, color){
				if(color) this.saveProps()
				let distance = topleft.GetDistanceFrom(rightbottom)
				if(color){
					this.ctx.fillStyle = color;
					this.ctx.fillRect(topleft.x, topleft.y, distance.width, distance.height)
				}
				else{
					this.ctx.strokeRect(topleft.x, topleft.y, distance.width, distance.height)
				}
				if(color) this.restoreProps()
			},
			DrawText: function(at, text, prop){
				if(prop) this.saveProps()
				if(prop && TextProp.InstanceOf(prop)){
					this.ctx.fillStyle = prop.color;
					this.ctx.textAlign = prop.align;
					this.ctx.font = prop.font;
				}
				let y = at.y;
				if(prop && prop.boundHeight){
				}
				this.ctx.fillText(text, at.x, y);
				if(prop) this.restoreProps()
			},
			GetTextWidth: function(text, prop){
				if(prop) this.saveProps()
				if(prop && TextProp.InstanceOf(prop))
					this.ctx.font = prop.font;
				let tm = this.ctx.measureText(text);
				if(prop) this.restoreProps()
				return tm.width;
			}
		},
		PRIVATE: {
			ctx: null,
			savedProps: {},
			savedPropNames: ["strokeStyle", "fillStyle", "textAlign"],
			saveProps: function(){
				JEEP.Utils.CopyProps(this.ctx, this.savedProps, this.savedPropNames)
			},
			restoreProps: function(){
				JEEP.Utils.CopyProps(this.savedProps, this.ctx, this.savedPropNames)
			}
		}
	})
})