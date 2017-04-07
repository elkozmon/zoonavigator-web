/*
 * Copyright (C) 2017  Ľuboš Kozmon
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ZNode} from "../znode/znode";

export class ZPath {

  private _currentNode: ZNode = null;

  constructor(
    private _allNodes: ZNode[]
  ) {
    const length = _allNodes.length;

    if (length > 0) {
      this._currentNode = _allNodes[length - 1];
    }
  }

  get currentNode(): ZNode | null {
    return this._currentNode;
  }

  get allNodes(): ZNode[] {
    return this._allNodes;
  }

  isRoot(): boolean {
    return this._currentNode === null;
  }

  goUp(): ZPath {
    if (this.isRoot()) {
      throw new Error("Can't go back. Already at root");
    }

    const copy = this._allNodes.slice();
    copy.splice(-1, 1);

    return new ZPath(copy);
  }

  goDown(name: string): ZPath {
    const copy = this._allNodes.slice();

    copy.push({
      path: this.isRoot() ? "/" + name : this.toString() + "/" + name,
      name: name
    });

    return new ZPath(copy);
  }

  toString(): string {
    if (this.isRoot()) {
      return "/";
    }

    return this._currentNode.path;
  }

  clone(): ZPath {
    return new ZPath(this._allNodes.slice());
  }
}
