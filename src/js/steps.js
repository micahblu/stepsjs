
(function($){
	$.fn.steps = function(data) {
		var source = this.html();
		var template = Handlebars.compile(source);
		console.log(template);
		this.after(template(data));
	};
}(jQuery));