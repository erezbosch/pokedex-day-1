Pokedex.Views.Pokemon = Backbone.View.extend({
  initialize: function () {
    this.$pokeList = this.$el.find('.pokemon-list');
    this.$pokeDetail = this.$el.find('.pokemon-detail');
    this.$newPoke = this.$el.find('.new-pokemon');
    this.$toyDetail = this.$el.find('.toy-detail');

    this.pokemon = new Pokedex.Collections.Pokemon();

    this.$pokeList.on(
      "click",
      "li.poke-list-item",
      this.selectPokemonFromList.bind(this)
    );

    this.$pokeDetail.on(
      "click",
      "li.toy-list-item",
      this.selectToyFromList.bind(this)
    );

    this.$newPoke.on("submit", this.submitPokemonForm.bind(this));

    this.$toyDetail.on(
      "change",
      "select.reassign",
      this.reassignToy.bind(this)
    );

    this.$toyDetail.on(
      "click",
      "input.item-update",
      this.updateToy.bind(this)
    );

    this.$pokeDetail.on(
      "click",
      "input.pokemon-update",
      this.updatePokemon.bind(this)
    );
  },

  createPokemon: function (attributes, callback) {
    this.pokemon.create(attributes, { success: callback.bind(this) });
  },

  selectPokemonFromList: function (e) {
    var id = $(e.currentTarget).data("id");
    var target = this.pokemon.find(function (p) {
      return p.get("id") === id;
    });
    this.renderPokemonDetail(target);
  },

  addPokemonToList: function (pokemon) {
    var $details = $("<li>");
    var nameText = "Name: " + pokemon.get("name");
    var typeText = "Type: " + pokemon.get("poke_type");
    $details.text(nameText + ", " + typeText).addClass("poke-list-item");
    $details.attr("data-id", pokemon.get("id"));
    this.$pokeList.append($details);
  },

  refreshPokemon: function () {
    var that = this;

    this.pokemon.fetch({
      success: function () {
        that.pokemon.each(function (p) {
          that.addPokemonToList(p);
        });
      }
    });
  },

  renderPokemonDetail: function (pokemon) {
    var $detail = $("<form>").addClass("detail");
    Object.keys(pokemon.attributes).forEach( function (attr) {
      if (attr !== "image_url" && attr !== "id") {
        var $input = $('<input>').val(pokemon.get(attr)).attr("type", "text");
        $input.attr("name", 'pokemon[' + attr + ']');
        var $label = $('<label>').text(attr).append($input);
        $detail.append($label).append('<br>');
    }});
    var $submitButton = $('<input type="submit">').addClass("pokemon-update")
                .data("id", pokemon.get("id"));
    $detail.append($submitButton);
    $detail.prepend("<img src=" + pokemon.get("image_url") + ">");
    $detail.append($("<ul>").addClass("toys"));

    var that = this;
    var pokeId = pokemon.get("id");

    pokemon.fetch({
      success: function (pokemon) {
        that.renderToyList(pokemon);
      }
    });
    this.$pokeDetail.html($detail);
  },

  renderToyList: function (pokemon) {
    this.$pokeDetail.find('.toys').empty();
    pokemon.toys().forEach(function (toy) {
      this.addToyToList(toy);
    }.bind(this));
  },

  addToyToList: function (toy) {
    var $toy = $("<li>").addClass("toy-list-item");
    var toyText = "";
    ["name", "happiness", "price"].forEach(function (attrib) {
      toyText += attrib + ": " + toy.get(attrib) + "  ";
    });
    $toy.text(toyText);
    $toy.data("toy-id", toy.get("id"));
    $toy.data("poke-id", toy.get("pokemon_id"));
    this.$pokeDetail.find("ul.toys").append($toy);
  },

  renderToyDetail: function (toy) {
    var $detail = $("<form>").addClass("detail");
    Object.keys(toy.attributes).forEach( function (attr) {
      if (attr !== "image_url" && attr !== "pokemon_id" && attr !== "id") {
        var $input = $('<input>').val(toy.get(attr)).attr("type", "text");
        $input.attr("name", 'toy[' + attr + ']');
        var $label = $('<label>').text(attr).append($input);
        $detail.append($label).append('<br>');
      }
    });
    var $submitButton = $('<input type="submit">').addClass("item-update")
                  .data("owner-id", toy.get("pokemon_id"))
                        .data("toy-id", toy.get("id"));
    var $selectBox = this.renderSelectBox(toy.get("id"), toy.get("pokemon_id"));
    $detail.append($selectBox).append("<br>");
    $detail.append($submitButton);

    $detail.prepend("<img src=" + toy.get("image_url") + ">");

    this.$toyDetail.html($detail);
  },

  selectToyFromList: function (e) {
    var $target = $(e.currentTarget);
    var id = $target.data("toy-id");
    var pokeId = $target.data("poke-id");

    var targetPoke = this.pokemon.find(function (p) {
      return p.get("id") === pokeId;
    });

    var target = targetPoke.toys().find(function (t) {
      return t.get("id") === id;
    });
    this.renderToyDetail(target);
  },

  submitPokemonForm: function (e) {
    e.preventDefault();
    var formData = $(e.currentTarget).serializeJSON();
    this.createPokemon(formData.pokemon, function (newPoke) {
      this.addPokemonToList(newPoke);
      this.renderPokemonDetail(newPoke);
    }.bind(this));
  },

  renderSelectBox: function(toyId, ownerId) {
    var $selectBox = $("<select>").addClass("reassign");
    $selectBox.data("pokemon-id", ownerId);
    $selectBox.data("toy-id", toyId);
    this.pokemon.each(function(pokemon) {
      var $option = $("<option>");
      $option.text(pokemon.get("name"));
      $option.attr("value", pokemon.get("id"));
      $option.prop("selected", pokemon.get("id") === ownerId);
      $selectBox.append($option);
    });

    return $("<label>Reassign</label>").append($selectBox);
  },

  reassignToy: function (e) {
    var $select = $(e.currentTarget);
    var toyId = $select.data("toy-id");
    var oldOwnerId = $select.data("pokemon-id");
    var newOwnerId = $select.val();

    var oldOwner = this.pokemon.find(function (p) {
      return p.get("id") === oldOwnerId;
    });

    var toy = oldOwner.toys().find(function (t) {
      return t.get("id") === toyId;
    });
    toy.set("pokemon_id", parseInt(newOwnerId));
    toy.save({}, {
      success: function () {
        oldOwner.toys().remove(toy);
        this.renderToyList(oldOwner);
        this.$toyDetail.empty();
      }.bind(this),
      error: function () {
        console.log("nnooo!!!!");
      }
    });
  },

  updateToy: function (e) {
    e.preventDefault();
    var $target = $(e.currentTarget);

    var owner = this.pokemon.find(function (p) {
      return p.get("id") === $target.data("owner-id");
    });

    var toy = owner.toys().find(function (t) {
      return t.get("id") === $target.data("toy-id");
    });

    toy.set($target.parent().serializeJSON().toy);
    toy.save({}, {
      success: function () {
        this.renderToyList(owner);
      }.bind(this)
    });
  },

  updatePokemon: function (e) {
    e.preventDefault();
    var $target = $(e.currentTarget);

    var pokemon = this.pokemon.find(function (p) {
      return p.get("id") === $target.data("id");
    });

    pokemon.set($target.parent().serializeJSON().pokemon);
    pokemon.save({}, { success: function () {
      var $newPoke = this.$pokeList.find('[data-id=' + pokemon.get("id") + ']');
      var nameText = "Name: " + pokemon.get("name");
      var typeText = "Type: " + pokemon.get("poke_type");
      $newPoke.text(nameText + ", " + typeText);
    }.bind(this)});
  }
});
