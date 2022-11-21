$(document).ready(function() {
  "use strict"; // Start of use strict
 
  //sidebar
  $("#mobileMenuBtn").click(function () {
	$(document.body).addClass('sidebar-expanded');
	});
	$("#closeSidebar").click(function () {
		$(document.body).removeClass('sidebar-expanded');
	});

	$("#mobileMenuBtn").click(function (e) {
		e.stopPropagation(); 
		return false;
	});
	//input group focus button
	$(".input-group > input, .input-group > select").focus(function(e){
		$(this).parent().addClass("input-group-focus");
	}).blur(function(e){
		$(this).parent().removeClass("input-group-focus");
	});

	//tooltip initialize
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

	//popover initialize
	const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
	const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
});