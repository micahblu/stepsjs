
(function($){
	$.fn.steps = function(data) {

		for(var i=0; i < data.steps.length; i++){
			// add id to each object
			data.steps[i].id = i;
		}

		var source = this.html();
		var template = Handlebars.compile(source);

		this.after(template(data));

		$(".panel-header").on('click', function(e){
			if($(this.getAttribute("data-target")).find('.panel-body').hasClass('collapse')){
				$('.panel-body').addClass('collapse');
				$(this.getAttribute("data-target")).find('.panel-body').removeClass('collapse');
			}
		});

		function contains(needle, str){
			var patt = new RegExp(needle);
			return patt.test(str);
		}
	};
}(jQuery));