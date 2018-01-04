import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material"
import {CreateZNodeData} from "./create-znode.data";

@Component({
  selector: "zoo-create-znode.dialog",
  templateUrl: "create-znode.dialog.html",
  styleUrls: ["dialog.scss"]
})
export class CreateZNodeDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: CreateZNodeData) {
  }
}
