import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material"
import {DuplicateZNodeData} from "./duplicate-znode.data";

@Component({
  selector: "zoo-duplicate-znode.dialog",
  templateUrl: "duplicate-znode.dialog.html",
  styleUrls: ["dialog.scss"]
})
export class DuplicateZNodeDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DuplicateZNodeData) {
  }
}
