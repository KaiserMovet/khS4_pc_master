var pcCardHeader = {

    saveNewName(form_id, computer_id) {
        var new_name = $(`#${form_id}`)[0].value;
        pcCardHeader.saveHeaderWithName(computer_id, new_name);
        pcCards.sendCommand(computer_id, `name;${new_name}`)

    },

    saveHeaderWithName(computer_id, name) {
        header_html = pcCardHeader.getHeaderHTML(computer_id, name);
        header_element = pcCardHeader.getHeaderElement(computer_id, name);
        header_element.innerHTML = header_html;
    },

    getHeaderElement: function (computer_id) {
        var header = $(`#${computer_id}`).find(".card-header");
        return header[0]
    },

    editName: function (computer_id) {
        var header_element = pcCardHeader.getHeaderElement(computer_id);
        header_element.innerHTML = pcCardHeader.getHeaderEditHTML(computer_id)
        console.log(header_element);
    },

    getHeaderEditHTML: function (computer_id) {
        var current_name = $(pcCardHeader.getHeaderElement(computer_id)).find("#name")[0].innerHTML;
        console.log(current_name);
        var form_id = computer_id + "_name_edit";
        var header =
            `<form class="row row-cols-lg-auto g-3 align-items-center">
                <div class="col-12">
                <div class="input-group">
                    <input type="text" maxlength=18 class="form-control form-control-sm" id="${form_id}" value="${current_name}">
                </div>
                </div>
                <div class="col-12">
                    <button type="button" class="btn btn-success btn-sm" onClick="pcCardHeader.saveNewName('${form_id}','${computer_id}')"><i class="bi bi-check"></i></button>
                </div>
                <div class="col-12">
                    <button type="button" class="btn btn-danger btn-sm" onClick="pcCardHeader.saveHeaderWithName('${computer_id}','${current_name}')"><i class="bi bi-x"></i></button>
                </div>
            </form>`
        return header;
    },

    getHeaderHTML: function (computer_id, name = "") {
        var header =
            `<a id="name">${name}</a>
            <a id="ip"></a>
            <button type='button' class="btn btn-primary btn-sm" onClick='pcCardHeader.editName("${computer_id}")'>
                <i class="bi bi-pencil-fill"></i>
            </button>`;
        return header;
    }

}



var pcCards = {

    buildURL: function (computer_id) {
        var mac = pcCards.getRealMac(computer_id);
        return pcMain.getApiUrl() + `/send/${mac}/`
    },

    getRealMac: function (temp_mac) {
        console.log(temp_mac)
        real_mac = temp_mac.substring(3).replaceAll("_", ":");
        return real_mac;
    },

    sendCommand: function (computer_id, command) {
        console.log("SEND", computer_id, command);
        var url = pcCards.buildURL(computer_id);
        console.log("URL", url);
        var data = { "command": command };
        RequestManager.getData(url, null, data);
    },

    updateCard: function (computer_data) {
        var card = $("#pcCards").find(`#${computer_data.pk}`);
        // set background color
        var active_class_str = "text-white bg-success";
        var inactive_class_str = "text-white bg-danger";
        var class_list = [active_class_str, inactive_class_str];
        if (computer_data.fields.is_alive) {
            Utils.setClass(card, 0, class_list);
        } else {
            Utils.setClass(card, 1, class_list);

        };

        // set name
        name_element = card.find("#name");
        name_element.html(computer_data.fields.name);

        // set ip
        ip_element = card.find("#ip");
        ip_element.html(computer_data.fields.ip);

    },

    createCard: function (cards_div, computer_id) {
        template =
            `<div class="card" id=${computer_id}>
                <div class="card-header">
                ${pcCardHeader.getHeaderHTML(computer_id)}
                </div>
                <div class="card-body">
                    <h5 class="card-title">Special title treatment</h5>
                    <button type='button' onClick='pcCards.sendCommand("${computer_id}", "on")'>on</button>
                    <button type='button' onClick='pcCards.sendCommand("${computer_id}", "off")'>off</button>
                    <button type='button' onClick='pcCards.sendCommand("${computer_id}", "volume;0")'>volume 0</button>
                    <button type='button' onClick='pcCards.sendCommand("${computer_id}", "volume;50")'>volume 50</button>
                    <button type='button' onClick='pcCards.sendCommand("${computer_id}", "volume;100")'>volume 100</button>
                </div>
            </div>`;
        var card = $.parseHTML(template);
        cards_div.append(card);
        return card;
    },

    createCardIfNotExists: function (computer_id) {
        var cards_div = $("#pcCards");
        var card = cards_div.find(`#${computer_id}`);
        if (card.length == 0) {
            card = pcCards.createCard(cards_div, computer_id);
        };
    },

    specialUpdate: function (data) {
        console.log("READY")
        var bar = $("#autorefresh_bar")[0];
        var progressbar_class_list = ["bg-success", "bg-warning"]
        data = pcCards.prepareData(data);
        data.forEach(computer_data => {
            pcCards.createCardIfNotExists(computer_data.pk);
            pcCards.updateCard(computer_data);
        });
        // Bar to success
        Utils.setClass(bar, 0, progressbar_class_list);
        bar.innerHTML = ""
        pcCards.update()
    },

    update: function () {
        var bar = $("#autorefresh_bar")[0];
        var current_second = parseInt(bar.getAttribute("aria-valuenow"));
        var max_second = parseInt(bar.getAttribute("aria-valuemax"));
        console.log(current_second, max_second)
        current_second += 1;
        if (current_second > max_second) current_second = 0;

        // Update progress bar
        var progressbar_class_list = ["bg-success", "bg-warning text-white"]
        var current_percentage = Math.round(current_second * 100 / max_second)
        $("#autorefresh_bar")[0].setAttribute("aria-valuenow", current_second);
        $("#autorefresh_bar")[0].setAttribute("style", `width: ${current_percentage}%`);

        // Update once per 10 seconds
        if (current_second == max_second) {
            // Bar to warning
            Utils.setClass(bar, 1, progressbar_class_list);
            bar.innerHTML = "Loading..."
            // Update Cards
            var url = pcMain.getApiUrl() + "/get_all/";
            RequestManager.getData(url, pcCards.specialUpdate)
        }
        else {
            // Refresh every 10 seconds
            setTimeout(pcCards.update, 1000)
        }
    },

    prepareData: function (data) {
        data = JSON.parse(data);

        //add 'mac' and remove : in mac address
        data.forEach(computer_data => {
            computer_data.pk = "mac" + computer_data.pk.replaceAll(":", "_")
        });
        return data
    },

    main: function () {

        // Set refreshing time to 10 seconds
        $("#autorefresh_bar")[0].setAttribute("aria-valuemax", 9);
        $("#autorefresh_bar")[0].setAttribute("aria-valuenow", 8);
        pcCards.update()
    }
}

var pcMain = {

    getApiUrl: function () {
        return "/pc_master/api";
    },

    onLoad: function () {
        pcCards.main();
    }
}

window.onload = pcMain.onLoad;