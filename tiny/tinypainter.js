// Created by Vinay.M.S as a part of demonstration for the JEEP framework.
// Usable subject to MIT license

JEEP.RegisterLibrary("TinyPainter", function(){
	let env = this.namespace.GetEnvironment();
	let Item = env.CreateRecordDef("Item", {
		x: 0,
		y: 0,
	})
	this.namespace.RegisterRecordDef("Line", {
		xa: 0,
		ya: 0,
		xb: 0,
		yb: 0,
		color: ""
	})
	this.namespace.RegisterRecordDef("Rectangle", {
		EXTENDS: [Item],
		width: 0,
		height: 0,
		fillColor: "",
		lineColor: "",
	})
	this.namespace.RegisterRecordDef("Text", {
		EXTENDS: [Item],
		content: "",
		color: "",
		font: "",
		boundHeight: 0,
	})

	let TCLib = env.GetLibrary("TinyCanvas")
	let Canvas = TCLib.GetObjectDef("CanvasXY");
	let Point = TCLib.GetObjectDef("Point");
	let TextProp = TCLib.GetObjectDef("TextProperty");

	this.namespace.RegisterClassDef("Painter", {
		CONSTRUCTOR: function(canvas){
			this.canvas = Canvas.New(canvas);
		},
		PUBLIC: {
			GetCanvasElement: function(){return this.canvas.GetCanvasElement()},
			Reset: function(){this.canvas.Clear()},
			AddLine: function(line){
				this.canvas.DrawLine(
					Point.InitNew({x: line.xa, y: line.ya}),
					Point.InitNew({x: line.xb, y: line.yb}),
					line.color,
				)
			},
			AddRectangle: function(rect){
				this.canvas.DrawBox(
					Point.InitNew({x: rect.x, y: rect.y}),
					Point.InitNew({x: rect.x+rect.width, y: rect.y+rect.height}),
					rect.fillColor
				)
			},
			AddText: function(text){
				this.canvas.DrawText(
					Point.InitNew({x: text.x, y: text.y}),
					text.content,
					TextProp.InitNew({font: text.font, color: text.color, boundHeight: text.boundHeight})
				);
			},
			GetTextWidth: function(text){
				return this.canvas.GetTextWidth(text.content, TextProp.InitNew({font: text.font}));
			},
		},
		PRIVATE: {
			canvas: null,			
		}
	})
})