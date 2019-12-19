import { StyledPrimaryButton } from "../components/Buttons";
import React from "react";
import AppContext from "./AppContext";
import {
  regulatedCities,
  regulatedCounties
} from "../../data/regulatedLocations";
import { navigate } from "@reach/router";

class FlowSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      zip: "",
      disabled: true,
    };
  }

  onClick(appCtx) {
    var zip = appCtx.zip;

    var zip = appCtx.zip;
    var town = appCtx.town;
    var county = appCtx.county;
    var to = "";
    if (town !== "") {
      var disabled = false;
      this.setState({ disabled });
    }

    if (town in regulatedCities) {
      to = "/eligibility/cities/" + town;
    } else if (county in regulatedCounties) {
      to = "/eligibility/counties/" + county;
    } else if (town != "") {
      to = "/eligibility/state";
    }

    if (to) {
      navigate(to);
    }
  }

  render() {
    return (
      <AppContext.Consumer>
        {({ appCtx, updateContext }) => (
          <div>
            <StyledPrimaryButton disabled={!appCtx.validCAZip} onClick={(e)=>{this.onClick(appCtx)}}>Look up</StyledPrimaryButton>
            {(appCtx.town === undefined && appCtx.zip !== undefined) ?
              <p className="error">Please enter a valid California ZIP code</p>
            :
              <p className="error"></p>
            }
          </div>
        )}
      </AppContext.Consumer>
    );
  }
}

export default FlowSelector;