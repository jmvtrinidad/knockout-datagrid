
# ko-datagrid

KnockoutJs datagrid is a library that can be used just like [jQuery.DataTables](https://datatables.net/). It can be used in any UI that needs a paging or server side processing. It was inspired through the [work](http://knockoutjs.com/examples/grid.html) of [Ryan Niemeyer](https://github.com/rniemeyer). It also provides [class](https://github.com/jmvtrinidad/knockout-datagrid/blob/master/model/DataGridRequest.cs) for ASP.NET MVC Model binding.

Please refer to [demo](http://jmvtrinidad.github.io/knockout-datagrid/)

# Knockout-datagrid supports

 - Javascript Source      (`var tbl = new ko.dataGrid.vm({ data: items, searchField: 'username' });`)
 - Ajax Source            (`var tbl = new ko.dataGrid.vm({ url: 'Users/GetAll', searchField: 'username' });`)
 - ServerSide Processing  (`var tbl = new ko.dataGrid.vm({ url: 'Users/GetPerPage', serverSide: true });`)

##Getting started

1. Include knockout, knockout-datagrid, bootstrap css, jQuery and blockUI .

    ```html
    <!--Vendor-->
    <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"/>

    <script src="https://code.jquery.com/jquery-2.2.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.blockUI/2.70/jquery.blockUI.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-debug.js"></script>
    <script src="js/knockout-DataGrid.js"></script>
    <!--End Vendor-->
    ```

2. Specify your html markup, you can also use this on any element that needs paging.

    ```html
   	<div id="htmlAjaxSource" data-bind="dataGrid: tbl">
       <table class="table table-bordered table-condensed">
           <thead>
               <tr>
                   <td>Username</td>
                   <td>CreatedOn/By</td>
               </tr>
           </thead>
           <tbody>
               <tr data-bind="visible: totalRows() === 0" style="background-color: #f9f9f9;">
                   <td colspan="3">No record/s to display.</td>
               </tr>
               <!--ko foreach: itemsOnCurrentPage-->
               <tr>
                   <td>
                       <a href="#" data-bind="text:username, click:$parent.alertInfo"></a>
                   </td>
                   <td data-bind="text:emailAddress"></td>
               </tr>
               <!--/ko-->
           </tbody>
       </table>
       <span data-bind="text:info()"></span>
   </div>
    ```

3. Instantiate ko.dataGrid.vm, for more option please refer to the [code](https://github.com/jmvtrinidad/knockout-datagrid/blob/master/js/knockout-DataGrid.js).

    ```JavaScript
    
    function AppViewModel() {
        this.tblAjaxSource = new ko.dataGrid.vm({ url: 'request/GetAjax.json', searchField: 'username' });
    }
    ```
4. Apply Bindings

    ```JavaScript
	   ko.applyBindings(new AppViewModel());​
    ```

5. [demo](http://jmvtrinidad.github.io/knockout-datagrid/)

##ASP.NET MVC Model binding

For JsonCamelCaseResult(), please refer to this [answer](http://stackoverflow.com/questions/19445730/how-can-i-return-camelcase-json-serialized-by-json-net-from-asp-net-mvc-controll#answer-19445731) on [StackOverflow](http://stackoverflow.com/).
	
    ```
        public ActionResult GetData(DataGridRequest<string> request)
        {
            using (var manager = new DataManager())
            {
                var result = manager.Select(request);

                return new JsonCamelCaseResult(new DataGridResponse<Criteria>(result, request),
                    JsonRequestBehavior.AllowGet);
            }
        }
    ```


##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
