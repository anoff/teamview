module.exports.home = `
<div>
  <div class="infos box" id="search-planets">
    <div class="planeto title">Search Reports <i class="fas fa-search"></i></i></div>
    <div>
      <table>
        <tbody>
          <tr>
            <th colspan="3">Specify search</th>
          </tr>
          <tr style="height:20px;">
            <td>Type</td>
            <td>Parameters</td>
            <td>Action</td>
          </tr>
          <tr style="height:20px;">
            <td>by Player</td>
            <td><label>Playername: </label><input type="text" name="byplayer_name" id="byplayer_name" size="40" value=""
                style="max-width: 10em;"></td>
            <td><button id="byplayer_search">Search</button></td>
          </tr>
          <tr style="height:20px;">
            <td>by Alliance</td>
            <td>
              <div>
                <div><label>Alliance name: </label><input type="text" id="byalliance_name" size="40" value=""></div>
                <div>
                  <label>Galaxy: </label><input type="number" id="byalliance_galaxy_min" size="3" value="1"> - <input type="number" id="byalliance_galaxy_max" size="3" value="1">
                  <label>System: </label><input type="number" id="byalliance_system_min" size="3" value="1"> - <input type="number" id="byalliance_system_max" size="3" value="1">
                </div>
              </div>
            </td>
            <td><button id="byalliance_search">Search</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <table id="search-results" class="">
        <tbody>
          <tr>
            <th colspan="10">Search Results</th>
          </tr>
          <tr>
            <th style="white-space: nowrap">Pos.</th>
            <th style="white-space: nowrap">Planet</th>
            <th style="white-space: nowrap">Name</th>
            <th style="white-space: nowrap">Moon</th>
            <th style="white-space: nowrap">Debris</th>
            <th style="white-space: nowrap">Player</th>
            <th style="white-space: nowrap">Alliance</th>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`
