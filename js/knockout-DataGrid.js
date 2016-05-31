(function () {

    (function () {

        //Available option for creating instance
        //int:pageSize        
        //bool:serverSide
        //string:url
        //bool:deferRender
        //bool:showProcessing
        //string:searchField
        //object: toolbox
        //bool: toolbox.refresh
        //function:model

        //Can be used in html data-binding        
        //:itemsOnCurrentPage:observableArray
        //:info:string
        //:totalRows:int
        //observable:searchValue

        function dataGrid(configuration) {
            var self = this, draw = 0;
            self.disposable = [];
            self.draw = function (inc) {
                if (!inc) return draw;
                return draw = draw + inc;
            };
            self.serverSide = configuration.serverSide ? true : false;
            self.toolbox = configuration.toolbox || {};
            self.toolbox.refresh = self.serverSide === false ? false : self.toolbox.refresh !== false; //by default true if serverside is true
            self.pageSize = configuration.pageSize || 10;
            self.currentPageIndex = ko.observable(1);
            self.deferRender = getDefaultValue(true, configuration.deferRender);
            self.isProcessing = ko.observable(false);
            self.showProcessing = getDefaultValue(true, configuration.showProcessing);
            self.url = configuration.url;
            self.searchValue = ko.observable('');
            self.model = configuration.model;
            self.error = ko.observable('');

            if (self.serverSide) {
                self.totalRows = ko.observable(0);
            } else {
                self.totalRows = ko.pureComputed(function () {
                    return ko.unwrap(self.filteredItems).length;
                }, self);
            }

            //Is ajax source only
            self.isAjaxSource = self.url && !self.serverSide;
            if (!self.serverSide) self.searchField = configuration.searchField;


            //items/data in table
            self.data = configuration.data || ko.observableArray([]);
            self.filteredItems = ko.pureComputed(function () {
                if (self.serverSide) {
                    return ko.unwrap(self.data);
                } else {
                    var filter = self.searchValue().toLowerCase();
                    if (!filter) return ko.unwrap(self.data);
                    if (!self.searchField) throw new error('To use search for client side processing, searchField option must defined.');
                    return ko.utils.arrayFilter(ko.unwrap(self.data), function (item) {
                        return ko.utils.stringStartsWith(ko.unwrap(item[self.searchField]).toLowerCase(), filter);
                    });
                }
            }, self);
            self.itemsOnCurrentPage = ko.pureComputed(function () {
                if (self.serverSide) return ko.unwrap(self.filteredItems);

                return ko.unwrap(self.filteredItems).slice(self.start(), self.start() + self.pageSize);
            }, self);

            //Configure Paging
            self.maxPageIndex = ko.pureComputed(function () {
                var index = Math.ceil(self.totalRows() / self.pageSize);
                if (index < self.currentPageIndex()) self.setCurrentPage(1);
                return index;
            }, self);
            self.pageStartNo = ko.pureComputed(function () {
                return self.currentPageIndex() <= 4 
                    ? 1 
                : self.currentPageIndex() >= self.maxPageIndex() - 3 
                    ? self.maxPageIndex() - 6
                : self.currentPageIndex() - 3;
            }, self);
            self.pageEndNo = ko.pureComputed(function () {
                var pageEnd = self.pageStartNo() + 6;
                return pageEnd > self.maxPageIndex() ? self.maxPageIndex() : pageEnd;
            }, self);
            self.start = ko.pureComputed(function () {
                if (self.currentPageIndex() === 0) return 0;

                return (self.currentPageIndex() - 1) * self.pageSize;
            }, self);
            self.recordStartNo = ko.pureComputed(function () {
                return self.totalRows() > self.pageSize ? (self.start() + 1) : self.totalRows() === 0 ? 0 : 1;
            }, self);
            self.recordEndNo = ko.pureComputed(function () {
                return (self.start() + self.pageSize) < self.totalRows() ? (self.start() + self.pageSize) : self.totalRows();
            }, self);
            self.info = ko.pureComputed(function () { return 'Showing ' + self.recordStartNo() + ' to ' + self.recordEndNo() + ' of ' + self.totalRows() + ' entries'; }, self);
        }

        dataGrid.prototype.search = function (searchValue) {
            var self = this;
            if (searchValue)
                self.searchValue(searchValue);
            if (self.serverSide || self.isAjaxSource)
                getData.call(self);
        };

        dataGrid.prototype.setCurrentPage = function (pageNo) {
            var self = this;
            if (self.currentPageIndex() === pageNo || pageNo === 0) {
                return;
            }
            self.currentPageIndex(pageNo);
            if (!self.serverSide) {
                return;
            }

            getData.call(self);
        };

        dataGrid.prototype.clear = function () {
            var self = this;
            self.data([]);
            self.currentPageIndex(1);
            self.searchValue('');
            if (self.serverSide) self.totalRows(0);
        };

        dataGrid.prototype.dispose = function () {
            var self = this;
            self.currentPageIndex(0);
            self.isProcessing(false);
            self.searchValue('');
            if (self.serverSide) self.totalRows(0);
            self.data([]);

            for (var i = 0; i < self.disposable.length; i++) {
                self.disposable[i].dispose();
            }
            self.disposable = [];
        };

        function getData() {
            var self = this;

            self.isProcessing(true);
            return $.ajax(self.url, {data:buildQuery.call(self)}).then(function (r) {
                self.error('');
                if (self.draw() > r.draw) return;
                if (self.currentPageIndex() === 0 && r.recordsTotal > 0) self.currentPageIndex(1);
                self.data(self.model ? r.data.map(function (item) { return new self.model(item); }) : r.data);
                if (!self.isAjaxSource)
                    self.totalRows(r.recordsTotal);
            }, function (xhr, errorText, statusText) {
                if (xhr.status === 500 && xhr.responseText.indexOf('friendlyMessage') !== -1){
                    self.clear();
                    var error = JSON.parse(xhr.responseText);
                    self.error(error.friendlyMessage);
                    xhr.showError = false;
                    console.log(error);
                }else{
                    self.error(statusText);
                }
            }).always(function() {
                self.isProcessing(false);
            });
        }

        function buildQuery() {
            var self = this;

            var param = $.extend({
                draw: self.draw(1),
                search: { value: ko.unwrap(self.searchValue) },
                length: self.pageSize,
                start: self.start()
            }, self.additionalParam);
            return param;
        }

        function getDefaultValue(defaultValue, valueIf) {
            return valueIf === false
                ? false
            : valueIf ? valueIf : defaultValue;
        }
        ko.dataGrid = {
            vm: dataGrid
        };

    })();

    $.fn.showProcessing = function (message) {
        this.block({
            overlayCSS: {
                backgroundColor: '#ffe'
            },
            message: (message || 'Processing...'),
            css: {
                border: 'none',
                color: '#345',
                background: 'none',
                borderRadius: '7px',
                left: '35%'
            }
        });
    };

    $.fn.hideProcessing = function () {
        this.unblock();
    };


    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + '<' + '/script>');
    };

    templateEngine.addTemplate('ko_dataGrid_pageLinks', '<div><ul class="pagination pull-right"> ' +
        '<li data-bind="css:{disabled:currentPageIndex() === 1 || 0 === maxPageIndex()}"><a href="#" aria-label="Previous" data-bind="click:function(){setCurrentPage(1)}"><span aria-hidden="true">&laquo;</span></a></li> ' +
        '<li data-bind="css:{disabled:currentPageIndex() === 1 || 0 === maxPageIndex()}"><a href="#" aria-label="Previous" data-bind="click:function(){if(currentPageIndex() !== 1)setCurrentPage(currentPageIndex() - 1)}"><span aria-hidden="true">&lsaquo;</span></a></li> ' +
        '<!-- ko foreach: ko.utils.range(pageStartNo(), pageEndNo()) --> ' +
        '<li data-bind="css: {active: $root.currentPageIndex() === $data}"><a href="#" data-bind="text: $data, click: function() { $root.setCurrentPage($data) }, css: { selected: $data == $root.currentPageIndex() }"></a></li> ' +
        '<!-- /ko --> ' +
        '<li data-bind="css:{disabled:currentPageIndex() === maxPageIndex() || 0 === maxPageIndex()}"><a href="#" aria-label="Last" data-bind="click:function(){if(currentPageIndex() !== maxPageIndex())setCurrentPage(currentPageIndex() + 1)}"><span aria-hidden="true">&rsaquo;</span></a></li> ' +
        '<li data-bind="css:{disabled:currentPageIndex() === maxPageIndex() || 0 === maxPageIndex()}"><a href="#" aria-label="Last" data-bind="click:function(){setCurrentPage(maxPageIndex())}"><span aria-hidden="true">&raquo;</span></a></li> ' +
        '</ul></div>');
    templateEngine.addTemplate('ko_dataGrid_toolbox', '<div class="pull-right" style="padding-right: 10px;">\
        <button data-bind="click:search.bind($data,undefined)" class="btn btn-default"><span class="glyphicon glyphicon-refresh"></span></button>\
        </div>');
    templateEngine.addTemplate('ko_dataGrid_error', '<div data-bind="visible: error() !== \'\'" class="alert alert-danger">\
        <strong ><a href="#" class="alert-link" data-bind="click:search.bind($data,undefined)">Please try again!</a></strong>\
        <p data-bind="text:error()"></p>\
        </div>');


    // The "dataGrid" binding
    ko.bindingHandlers.dataGrid = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext){
            var vmAccessor = valueAccessor();

            // Make a modified binding context, with a extra properties, and apply it to descendant elements
            var childBindingContext = bindingContext.createChildContext(
                bindingContext.$rawData,
                null, // Optionally, pass a string here as an alias for the data item in descendant contexts
                function (context) {
                    ko.utils.extend(context, valueAccessor());
                });
            ko.applyBindingsToDescendants(childBindingContext, element);
            if (((vmAccessor.serverSide || vmAccessor.isAjaxSource) && vmAccessor.showProcessing) && vmAccessor.deferRender) $(element).showProcessing();

            //request initial data
            if (((vmAccessor.url && !vmAccessor.serverSide) || (vmAccessor.serverSide)) && vmAccessor.deferRender) vmAccessor.search();

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
        },
        // This method is called to initialize the node, and will also be called again if you change what the grid is bound to
        update: function(element, viewModelAccessor, allBindings){
            var viewModel = viewModelAccessor();

            // Allow the default templates to be overridden
            var errorTemplateName = allBindings.get('dataGridErrorTemplate') || 'ko_dataGrid_error',
                toolboxTemplateName = allBindings.get('dataGridTooloboxTemplate') || 'ko_dataGrid_toolbox',
                pageLinksTemplateName = allBindings.get('dataGridPagerTemplate') || 'ko_dataGrid_pageLinks';

            //var columnCount = element.getElementsByTagName('thead')[0].getElementsByTagName('td').length;
            //var noRecordRow = '<tr data-bind="visible: totalRows() === 0" style="background-color: #f9f9f9;">\
            //                                                    <td colspan="'+columnCount+'">No record/s to display.</td>\
            //                                                </tr>';
            //var body = element.getElementsByTagName('tbody')[0];
            //body.appendChild($(noRecordRow)[0]);
            var row;
            if (viewModel.serverSide && viewModel.toolbox.refresh) {
                // Render the toolbox
                row = createElem('div', 'row');
                row.appendChild(createElem('div', 'col-sm-12'));
                element.insertBefore(row, element.firstChild);
                //var pageLinksContainer = element.appendChild(row);
                ko.renderTemplate(toolboxTemplateName, viewModel, { templateEngine: templateEngine }, row.childNodes[0], 'replaceChildren');
            }

            // Render the error handler
            row = createElem('div', 'row');
            row.appendChild(createElem('div', 'col-sm-12'));
            //element.insertBefore(row, element.firstChild);
            var pageLinksContainer = element.appendChild(row);
            ko.renderTemplate(errorTemplateName, viewModel, { templateEngine: templateEngine }, pageLinksContainer.childNodes[0], 'replaceChildren');

            // Render the page links
            row = createElem('div', 'row');
            row.appendChild(createElem('div', 'col-sm-12'));
            pageLinksContainer = element.appendChild(row);
            ko.renderTemplate(pageLinksTemplateName, viewModel, { templateEngine: templateEngine }, pageLinksContainer.childNodes[0], 'replaceChildren');

            element.appendChild(createElem('div', 'isProcessing'));

            if (viewModel.showProcessing)
                viewModel.disposable.push(viewModel.isProcessing.subscribe(function (val) {
                    if (val)
                        $(element).showProcessing();
                    else
                        $(element).hideProcessing();
                }));
        }
    };

    function createElem(tag, className) {
        var elem = document.createElement(tag);
        elem.classList.add(className);
        return elem;
    }

})();
