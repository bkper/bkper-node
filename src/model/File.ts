import { Book } from "./Book";
import * as FileService from '../service/file-service';

/**
 * 
 * This class defines a File uploaded to a [[Book]].
 * 
 * A File can be attached to a [[Transaction]] or used to import data.
 * 
 * @public
 */
export class File {

  /** @internal */
  wrapped: bkper.File;
  
  /** @internal */
  book: Book;

  /**
   * Gets the File id
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * Gets the File name
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * 
   * Sets the name of the File.
   * 
   * @returns This File, for chainning.
   */    
  public setName(name: string): File {
    this.wrapped.name = name;
    return this;
  }  

  /**
   * Gets the File content type
   */
  public getContentType(): string {
    return this.wrapped.contentType;
  }

  /**
   * 
   * Sets the File content type.
   * 
   * @returns This File, for chainning.
   */    
  public setContentType(contentType: string): File {
    this.wrapped.contentType = contentType;
    return this;
  }    

  /**
   * Gets the file content Base64 encoded
   */
  public async getContent(): Promise<string> {
    if (this.getId() != null && (this.wrapped == null || this.wrapped.content == null)) {
      this.wrapped = await FileService.getFile(this.book.getId(), this.getId());
    }
    return this.wrapped.content;
  }

  /**
   * 
   * Sets the File content Base64 encoded.
   * 
   * @returns This File, for chainning.
   */    
  public setContent(content: string): File {
    this.wrapped.content = content;
    return this;
  } 
 
  /**
   * Gets the file serving url for accessing via browser
   */
  public getUrl(): string {
    return this.wrapped.url;
  }

  /**
   * Gets the file size in bytes
   */  
  public getSize(): number {
    return this.wrapped.size;
  }


  /**
   * Perform create new File.
   */
  public async create(): Promise<File> {
    this.wrapped = await FileService.createFile(this.book.getId(), this.wrapped);
    return this;
  }

}