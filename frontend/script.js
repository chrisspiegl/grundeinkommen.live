/*!
 * Magic Starts Here
 * https://NetworkPersonalConnections.ChrisSpiegl.com
 */

$(() => {
  console.log('Frontend is here too')

  $('button.toggle').click(function (event) {
    $(this).parent().find('.chartDaily').toggleClass('hidden');
    $(this).parent().find('.chartHourly').toggleClass('hidden');
    $(this).find('span.daily').toggleClass('active');
    $(this).find('span.hourly').toggleClass('active');
  })
})
